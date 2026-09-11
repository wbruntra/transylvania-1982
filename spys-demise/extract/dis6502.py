"""Documented-opcode 6502 disassembler, just enough for static mapping."""

OP = {}


def _add(op, mn, md, ln):
    OP[op] = (mn, md, ln)


for _op, _mn, _md, _ln in [
    (0xA9, 'LDA', '#', 2), (0xA5, 'LDA', 'zp', 2), (0xB5, 'LDA', 'zpx', 2),
    (0xAD, 'LDA', 'abs', 3), (0xBD, 'LDA', 'absX', 3), (0xB9, 'LDA', 'absY', 3),
    (0xA1, 'LDA', 'izx', 2), (0xB1, 'LDA', 'izy', 2),
    (0xA2, 'LDX', '#', 2), (0xA6, 'LDX', 'zp', 2), (0xB6, 'LDX', 'zpy', 2),
    (0xAE, 'LDX', 'abs', 3), (0xBE, 'LDX', 'absY', 3),
    (0xA0, 'LDY', '#', 2), (0xA4, 'LDY', 'zp', 2), (0xB4, 'LDY', 'zpx', 2),
    (0xAC, 'LDY', 'abs', 3), (0xBC, 'LDY', 'absX', 3),
    (0x85, 'STA', 'zp', 2), (0x95, 'STA', 'zpx', 2), (0x8D, 'STA', 'abs', 3),
    (0x9D, 'STA', 'absX', 3), (0x99, 'STA', 'absY', 3), (0x81, 'STA', 'izx', 2),
    (0x91, 'STA', 'izy', 2),
    (0x86, 'STX', 'zp', 2), (0x96, 'STX', 'zpy', 2), (0x8E, 'STX', 'abs', 3),
    (0x84, 'STY', 'zp', 2), (0x94, 'STY', 'zpx', 2), (0x8C, 'STY', 'abs', 3),
    (0xE6, 'INC', 'zp', 2), (0xF6, 'INC', 'zpx', 2), (0xEE, 'INC', 'abs', 3),
    (0xFE, 'INC', 'absX', 3),
    (0xC6, 'DEC', 'zp', 2), (0xD6, 'DEC', 'zpx', 2), (0xCE, 'DEC', 'abs', 3),
    (0xDE, 'DEC', 'absX', 3),
    (0x69, 'ADC', '#', 2), (0x65, 'ADC', 'zp', 2), (0x6D, 'ADC', 'abs', 3),
    (0xE9, 'SBC', '#', 2), (0xE5, 'SBC', 'zp', 2), (0xED, 'SBC', 'abs', 3),
    (0x29, 'AND', '#', 2), (0x25, 'AND', 'zp', 2), (0x2D, 'AND', 'abs', 3),
    (0x09, 'ORA', '#', 2), (0x05, 'ORA', 'zp', 2), (0x0D, 'ORA', 'abs', 3),
    (0x49, 'EOR', '#', 2), (0x45, 'EOR', 'zp', 2), (0x4D, 'EOR', 'abs', 3),
    (0xC9, 'CMP', '#', 2), (0xC5, 'CMP', 'zp', 2), (0xCD, 'CMP', 'abs', 3),
    (0xDD, 'CMP', 'absX', 3),
    (0xE0, 'CPX', '#', 2), (0xE4, 'CPX', 'zp', 2), (0xEC, 'CPX', 'abs', 3),
    (0xC0, 'CPY', '#', 2), (0xC4, 'CPY', 'zp', 2), (0xCC, 'CPY', 'abs', 3),
    (0x24, 'BIT', 'zp', 2), (0x2C, 'BIT', 'abs', 3),
    (0x0A, 'ASL', 'acc', 1), (0x06, 'ASL', 'zp', 2), (0x0E, 'ASL', 'abs', 3),
    (0x4A, 'LSR', 'acc', 1), (0x46, 'LSR', 'zp', 2), (0x4E, 'LSR', 'abs', 3),
    (0x2A, 'ROL', 'acc', 1), (0x26, 'ROL', 'zp', 2), (0x2E, 'ROL', 'abs', 3),
    (0x6A, 'ROR', 'acc', 1), (0x66, 'ROR', 'zp', 2), (0x6E, 'ROR', 'abs', 3),
    (0xAA, 'TAX', 'imp', 1), (0x8A, 'TXA', 'imp', 1), (0xA8, 'TAY', 'imp', 1),
    (0x98, 'TYA', 'imp', 1), (0xBA, 'TSX', 'imp', 1), (0x9A, 'TXS', 'imp', 1),
    (0x48, 'PHA', 'imp', 1), (0x68, 'PLA', 'imp', 1), (0x08, 'PHP', 'imp', 1),
    (0x28, 'PLP', 'imp', 1),
    (0x18, 'CLC', 'imp', 1), (0x38, 'SEC', 'imp', 1), (0x58, 'CLI', 'imp', 1),
    (0x78, 'SEI', 'imp', 1), (0xB8, 'CLV', 'imp', 1), (0xD8, 'CLD', 'imp', 1),
    (0xF8, 'SED', 'imp', 1),
    (0xCA, 'DEX', 'imp', 1), (0x88, 'DEY', 'imp', 1), (0xE8, 'INX', 'imp', 1),
    (0xC8, 'INY', 'imp', 1),
    (0xEA, 'NOP', 'imp', 1), (0x00, 'BRK', 'imp', 1), (0x40, 'RTI', 'imp', 1),
    (0x60, 'RTS', 'imp', 1),
    (0x4C, 'JMP', 'abs', 3), (0x6C, 'JMP', 'ind', 3), (0x20, 'JSR', 'abs', 3),
    (0x90, 'BCC', 'rel', 2), (0xB0, 'BCS', 'rel', 2), (0xF0, 'BEQ', 'rel', 2),
    (0xD0, 'BNE', 'rel', 2), (0x10, 'BPL', 'rel', 2), (0x30, 'BMI', 'rel', 2),
    (0x50, 'BVC', 'rel', 2), (0x70, 'BVS', 'rel', 2),
]:
    _add(_op, _mn, _md, _ln)


def disassemble(mem, base, start, count):
    """Disassemble `count` instrs from file-offset `start` (load addr = base)."""
    pc = start
    out = []
    n = 0
    while n < count and pc < len(mem):
        addr = base + pc
        op = mem[pc]
        if op not in OP:
            out.append("${:04X}: db ${:02X}".format(addr, op))
            pc += 1
            n += 1
            continue
        mn, mode, ln = OP[op]
        bs = mem[pc:pc + ln]
        if len(bs) < ln:
            out.append("${:04X}: db ${:02X} (trunc)".format(addr, op))
            break
        if mode == '#':
            opr = "#${:02X}".format(bs[1])
        elif mode == 'zp':
            opr = "${:02X}".format(bs[1])
        elif mode in ('zpx', 'zpy', 'izx', 'izy'):
            opr = "${:02X},{}".format(bs[1], mode[1:])
        elif mode == 'abs':
            opr = "${:02X}{:02X}".format(bs[2], bs[1])
        elif mode in ('absX', 'absY'):
            sx = 'X' if 'X' in mode else 'Y'
            opr = "${:02X}{:02X},{}".format(bs[2], bs[1], sx)
        elif mode == 'ind':
            opr = "(${:02X}{:02X})".format(bs[2], bs[1])
        elif mode == 'rel':
            off = bs[1] if bs[1] < 128 else bs[1] - 256
            opr = "${:04X}".format(addr + 2 + off)
        elif mode == 'acc':
            opr = 'A'
        else:
            opr = ''
        hexs = ' '.join("{:02X}".format(b) for b in bs)
        out.append(("${:04X}: {} {}".format(addr, mn, opr)).rstrip() + "   ; " + hexs)
        pc += ln
        n += 1
    return out, pc
