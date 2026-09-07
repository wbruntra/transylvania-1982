"""A small NMOS 6502 interpreter.

Only as much as PICDRAW2 needs, which is to say the documented instruction set
without the undocumented opcodes. Memory is a flat 64K bytearray; addresses the
caller registers as hooks are handled in Python and returned from as if by RTS,
which is how the four Applesoft HIRES entry points are intercepted.
"""

C, Z, I, D, B, U, V, N = 1, 2, 4, 8, 16, 32, 64, 128


class CPU:
    def __init__(self, memory=None):
        self.mem = memory if memory is not None else bytearray(0x10000)
        self.a = self.x = self.y = 0
        self.sp = 0xFD
        self.pc = 0
        self.p = U | I
        self.hooks = {}
        self.cycles = 0

    # -- memory -----------------------------------------------------------
    def rd(self, addr):
        return self.mem[addr & 0xFFFF]

    def wr(self, addr, value):
        self.mem[addr & 0xFFFF] = value & 0xFF

    def rd16(self, addr):
        return self.rd(addr) | (self.rd(addr + 1) << 8)

    def rd16_bug(self, addr):
        """JMP () wraps within a page on NMOS parts."""
        lo = self.rd(addr)
        hi = self.rd((addr & 0xFF00) | ((addr + 1) & 0xFF))
        return lo | (hi << 8)

    # -- stack ------------------------------------------------------------
    def push(self, value):
        self.wr(0x100 + self.sp, value)
        self.sp = (self.sp - 1) & 0xFF

    def pop(self):
        self.sp = (self.sp + 1) & 0xFF
        return self.rd(0x100 + self.sp)

    # -- flags ------------------------------------------------------------
    def set_zn(self, value):
        value &= 0xFF
        self.p = (self.p & ~(Z | N)) | (Z if value == 0 else 0) | (value & N)
        return value

    def flag(self, mask, on):
        self.p = (self.p | mask) if on else (self.p & ~mask)

    # -- addressing -------------------------------------------------------
    def _imm(self):
        addr = self.pc
        self.pc += 1
        return addr

    def _zp(self):
        addr = self.rd(self.pc)
        self.pc += 1
        return addr

    def _zpx(self):
        addr = (self.rd(self.pc) + self.x) & 0xFF
        self.pc += 1
        return addr

    def _zpy(self):
        addr = (self.rd(self.pc) + self.y) & 0xFF
        self.pc += 1
        return addr

    def _abs(self):
        addr = self.rd16(self.pc)
        self.pc += 2
        return addr

    def _absx(self):
        addr = (self.rd16(self.pc) + self.x) & 0xFFFF
        self.pc += 2
        return addr

    def _absy(self):
        addr = (self.rd16(self.pc) + self.y) & 0xFFFF
        self.pc += 2
        return addr

    def _indx(self):
        base = (self.rd(self.pc) + self.x) & 0xFF
        self.pc += 1
        return self.rd(base) | (self.rd((base + 1) & 0xFF) << 8)

    def _indy(self):
        base = self.rd(self.pc)
        self.pc += 1
        return ((self.rd(base) | (self.rd((base + 1) & 0xFF) << 8)) + self.y) & 0xFFFF

    def _rel(self):
        offset = self.rd(self.pc)
        self.pc += 1
        return (self.pc + ((offset ^ 0x80) - 0x80)) & 0xFFFF

    # -- operations -------------------------------------------------------
    def _adc(self, value):
        if self.p & D:
            # Decimal mode is not used by PICDRAW2; binary is close enough that
            # a wrong answer here would be loud rather than subtle.
            pass
        total = self.a + value + (self.p & C)
        self.flag(C, total > 0xFF)
        self.flag(V, bool((~(self.a ^ value) & (self.a ^ total)) & 0x80))
        self.a = self.set_zn(total)

    def _sbc(self, value):
        self._adc(value ^ 0xFF)

    def _cmp(self, reg, value):
        diff = (reg - value) & 0x1FF
        self.flag(C, reg >= value)
        self.set_zn(diff)

    def _branch(self, target, taken):
        if taken:
            self.pc = target

    def step(self):
        if self.pc in self.hooks:
            self.hooks[self.pc](self)
            self.pc = (self.pop() | (self.pop() << 8)) + 1  # RTS
            return

        op = self.rd(self.pc)
        self.pc += 1
        self.cycles += 1
        handler = OPS.get(op)
        if handler is None:
            raise NotImplementedError(f"opcode ${op:02X} at ${self.pc - 1:04X}")
        handler(self)

    def run(self, start, stop, limit=80_000_000):
        """Runs from `start` until PC reaches `stop`."""
        self.pc = start
        steps = 0
        while self.pc != stop:
            self.step()
            steps += 1
            if steps > limit:
                raise RuntimeError(f"did not stop after {limit} instructions")
        return steps


def _build():
    ops = {}

    def op(code):
        def register(fn):
            ops[code] = fn
            return fn
        return register

    # Loads and stores
    for code, mode, reg in [
        (0xA9, "_imm", "a"), (0xA5, "_zp", "a"), (0xB5, "_zpx", "a"),
        (0xAD, "_abs", "a"), (0xBD, "_absx", "a"), (0xB9, "_absy", "a"),
        (0xA1, "_indx", "a"), (0xB1, "_indy", "a"),
        (0xA2, "_imm", "x"), (0xA6, "_zp", "x"), (0xB6, "_zpy", "x"),
        (0xAE, "_abs", "x"), (0xBE, "_absy", "x"),
        (0xA0, "_imm", "y"), (0xA4, "_zp", "y"), (0xB4, "_zpx", "y"),
        (0xAC, "_abs", "y"), (0xBC, "_absx", "y"),
    ]:
        def load(cpu, mode=mode, reg=reg):
            setattr(cpu, reg, cpu.set_zn(cpu.rd(getattr(cpu, mode)())))
        ops[code] = load

    for code, mode, reg in [
        (0x85, "_zp", "a"), (0x95, "_zpx", "a"), (0x8D, "_abs", "a"),
        (0x9D, "_absx", "a"), (0x99, "_absy", "a"), (0x81, "_indx", "a"),
        (0x91, "_indy", "a"),
        (0x86, "_zp", "x"), (0x96, "_zpy", "x"), (0x8E, "_abs", "x"),
        (0x84, "_zp", "y"), (0x94, "_zpx", "y"), (0x8C, "_abs", "y"),
    ]:
        def store(cpu, mode=mode, reg=reg):
            cpu.wr(getattr(cpu, mode)(), getattr(cpu, reg))
        ops[code] = store

    # Arithmetic and logic
    for code, mode, fn in [
        (0x69, "_imm", "_adc"), (0x65, "_zp", "_adc"), (0x75, "_zpx", "_adc"),
        (0x6D, "_abs", "_adc"), (0x7D, "_absx", "_adc"), (0x79, "_absy", "_adc"),
        (0x61, "_indx", "_adc"), (0x71, "_indy", "_adc"),
        (0xE9, "_imm", "_sbc"), (0xE5, "_zp", "_sbc"), (0xF5, "_zpx", "_sbc"),
        (0xED, "_abs", "_sbc"), (0xFD, "_absx", "_sbc"), (0xF9, "_absy", "_sbc"),
        (0xE1, "_indx", "_sbc"), (0xF1, "_indy", "_sbc"),
    ]:
        def arith(cpu, mode=mode, fn=fn):
            getattr(cpu, fn)(cpu.rd(getattr(cpu, mode)()))
        ops[code] = arith

    for code, mode, oper in [
        (0x29, "_imm", "and"), (0x25, "_zp", "and"), (0x35, "_zpx", "and"),
        (0x2D, "_abs", "and"), (0x3D, "_absx", "and"), (0x39, "_absy", "and"),
        (0x21, "_indx", "and"), (0x31, "_indy", "and"),
        (0x09, "_imm", "ora"), (0x05, "_zp", "ora"), (0x15, "_zpx", "ora"),
        (0x0D, "_abs", "ora"), (0x1D, "_absx", "ora"), (0x19, "_absy", "ora"),
        (0x01, "_indx", "ora"), (0x11, "_indy", "ora"),
        (0x49, "_imm", "eor"), (0x45, "_zp", "eor"), (0x55, "_zpx", "eor"),
        (0x4D, "_abs", "eor"), (0x5D, "_absx", "eor"), (0x59, "_absy", "eor"),
        (0x41, "_indx", "eor"), (0x51, "_indy", "eor"),
    ]:
        def logic(cpu, mode=mode, oper=oper):
            value = cpu.rd(getattr(cpu, mode)())
            if oper == "and":
                cpu.a = cpu.set_zn(cpu.a & value)
            elif oper == "ora":
                cpu.a = cpu.set_zn(cpu.a | value)
            else:
                cpu.a = cpu.set_zn(cpu.a ^ value)
        ops[code] = logic

    for code, mode, reg in [
        (0xC9, "_imm", "a"), (0xC5, "_zp", "a"), (0xD5, "_zpx", "a"),
        (0xCD, "_abs", "a"), (0xDD, "_absx", "a"), (0xD9, "_absy", "a"),
        (0xC1, "_indx", "a"), (0xD1, "_indy", "a"),
        (0xE0, "_imm", "x"), (0xE4, "_zp", "x"), (0xEC, "_abs", "x"),
        (0xC0, "_imm", "y"), (0xC4, "_zp", "y"), (0xCC, "_abs", "y"),
    ]:
        def compare(cpu, mode=mode, reg=reg):
            cpu._cmp(getattr(cpu, reg), cpu.rd(getattr(cpu, mode)()))
        ops[code] = compare

    # Shifts and rotates
    def shift(cpu, addr, kind):
        value = cpu.a if addr is None else cpu.rd(addr)
        if kind == "asl":
            cpu.flag(C, bool(value & 0x80))
            value <<= 1
        elif kind == "lsr":
            cpu.flag(C, bool(value & 1))
            value >>= 1
        elif kind == "rol":
            carry = cpu.p & C
            cpu.flag(C, bool(value & 0x80))
            value = (value << 1) | carry
        else:
            carry = (cpu.p & C) << 7
            cpu.flag(C, bool(value & 1))
            value = (value >> 1) | carry
        value = cpu.set_zn(value)
        if addr is None:
            cpu.a = value
        else:
            cpu.wr(addr, value)

    for base, kind in [(0x0A, "asl"), (0x4A, "lsr"), (0x2A, "rol"), (0x6A, "ror")]:
        ops[base] = (lambda cpu, kind=kind: shift(cpu, None, kind))
        for code, mode in [(base - 0x0A + 0x06, "_zp"), (base - 0x0A + 0x16, "_zpx"),
                           (base - 0x0A + 0x0E, "_abs"), (base - 0x0A + 0x1E, "_absx")]:
            ops[code] = (lambda cpu, mode=mode, kind=kind: shift(cpu, getattr(cpu, mode)(), kind))

    # Increment and decrement
    for code, mode, delta in [(0xE6, "_zp", 1), (0xF6, "_zpx", 1), (0xEE, "_abs", 1),
                              (0xFE, "_absx", 1), (0xC6, "_zp", -1), (0xD6, "_zpx", -1),
                              (0xCE, "_abs", -1), (0xDE, "_absx", -1)]:
        def incdec(cpu, mode=mode, delta=delta):
            addr = getattr(cpu, mode)()
            cpu.wr(addr, cpu.set_zn(cpu.rd(addr) + delta))
        ops[code] = incdec

    ops[0xE8] = lambda cpu: setattr(cpu, "x", cpu.set_zn(cpu.x + 1))
    ops[0xCA] = lambda cpu: setattr(cpu, "x", cpu.set_zn(cpu.x - 1))
    ops[0xC8] = lambda cpu: setattr(cpu, "y", cpu.set_zn(cpu.y + 1))
    ops[0x88] = lambda cpu: setattr(cpu, "y", cpu.set_zn(cpu.y - 1))

    # Transfers
    ops[0xAA] = lambda cpu: setattr(cpu, "x", cpu.set_zn(cpu.a))
    ops[0xA8] = lambda cpu: setattr(cpu, "y", cpu.set_zn(cpu.a))
    ops[0x8A] = lambda cpu: setattr(cpu, "a", cpu.set_zn(cpu.x))
    ops[0x98] = lambda cpu: setattr(cpu, "a", cpu.set_zn(cpu.y))
    ops[0xBA] = lambda cpu: setattr(cpu, "x", cpu.set_zn(cpu.sp))
    ops[0x9A] = lambda cpu: setattr(cpu, "sp", cpu.x)

    # Stack
    ops[0x48] = lambda cpu: cpu.push(cpu.a)
    ops[0x68] = lambda cpu: setattr(cpu, "a", cpu.set_zn(cpu.pop()))
    ops[0x08] = lambda cpu: cpu.push(cpu.p | B | U)
    ops[0x28] = lambda cpu: setattr(cpu, "p", (cpu.pop() | U) & ~B)

    # Flags
    for code, mask, on in [(0x18, C, False), (0x38, C, True), (0x58, I, False),
                           (0x78, I, True), (0xB8, V, False), (0xD8, D, False),
                           (0xF8, D, True)]:
        ops[code] = (lambda cpu, mask=mask, on=on: cpu.flag(mask, on))

    # Branches
    for code, mask, want in [(0x10, N, False), (0x30, N, True), (0x50, V, False),
                             (0x70, V, True), (0x90, C, False), (0xB0, C, True),
                             (0xD0, Z, False), (0xF0, Z, True)]:
        def branch(cpu, mask=mask, want=want):
            target = cpu._rel()
            cpu._branch(target, bool(cpu.p & mask) == want)
        ops[code] = branch

    # Jumps
    def jsr(cpu):
        target = cpu.rd16(cpu.pc)
        ret = cpu.pc + 1
        cpu.push(ret >> 8)
        cpu.push(ret & 0xFF)
        cpu.pc = target
    ops[0x20] = jsr

    def rts(cpu):
        cpu.pc = (cpu.pop() | (cpu.pop() << 8)) + 1
    ops[0x60] = rts

    def rti(cpu):
        cpu.p = (cpu.pop() | U) & ~B
        cpu.pc = cpu.pop() | (cpu.pop() << 8)
    ops[0x40] = rti

    ops[0x4C] = lambda cpu: setattr(cpu, "pc", cpu._abs())

    def jmp_ind(cpu):
        cpu.pc = cpu.rd16_bug(cpu.rd16(cpu.pc))
    ops[0x6C] = jmp_ind

    # BIT, NOP, BRK
    for code, mode in [(0x24, "_zp"), (0x2C, "_abs")]:
        def bit(cpu, mode=mode):
            value = cpu.rd(getattr(cpu, mode)())
            cpu.flag(Z, (cpu.a & value) == 0)
            cpu.flag(N, bool(value & 0x80))
            cpu.flag(V, bool(value & 0x40))
        ops[code] = bit

    ops[0xEA] = lambda cpu: None

    def brk(cpu):
        raise RuntimeError(f"BRK at ${cpu.pc - 1:04X}")
    ops[0x00] = brk

    return ops


OPS = _build()
