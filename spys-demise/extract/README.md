# Spy's Demise — original-code extraction

Source: `../Spys-Demise_C64_EN/SPYSDEMI.D64` (C64, 35-track D64).

## What the disk holds

4 PRG files, 88 blocks total (matches `VERSION.NFO` "Game Length: 88 Blocks"):

| File (D64 name) | Start | Blks | Load | Stub | Role |
|---|---|---|---|---|---|
| `SPY'S DEMISE+` | T17 S0 | 33 | `$0801` | `1997 SYS 2059` | game, crunched (Anubis ABS crack) |
| `SPY'S DEMISE DOX` | T19 S0 | 14 | `$0801` | `239 SYS 2061` | docs viewer (ML) |
| `T.SPY'S DEMISE` | T19 S7 | 10 | `$8000` | — | LOADSTAR briefing text (`docs.txt`) |
| `SPY'S DEMISE +` | T16 S2 | 31 | `$0801` | `239 SYS 2061` | game, 2nd version, **unpacked — use this** |

`v1`'s "BASIC" after the first line is ML overlapping the program area
(`$080B: LDY #$00 / SEI / INC $01 ...`); `v2` has a clean `00 00`
terminator with ML at `$080D`. Both `SYS` straight into ML.

## Loader (game_v2, `$080D`)

`SEI / INC $D030 / LDA #$38 STA $01` (bank out BASIC), staged copies to
`$0200` (depacker helpers) and 29 pages `$24xx -> $B3xx`, then
`JMP $0116` into the depacker. It runs ~650k emulated steps and exits via
`JSR $FF81` (CINT) from the unpacked init at `$7F00`.

Unpacked init (`data/entry.asm`): CINT, border/bg to 0, title `$7F60->$0400`,
key wait on `$C5`, zero-page setup, `JMP $8000` (VIC `$D011/$D016/$DD00/$D018`,
`$01` ROM switch, sprite pointers `$47F8-$47FF`).

## Rerun

```sh
python3 spys-demise/extract/extract_sd.py \
  --image spys-demise/Spys-Demise_C64_EN/SPYSDEMI.D64 \
  --out spys-demise/extract/data
python3 spys-demise/extract/unpack.py \
  --prg spys-demise/extract/data/SPY_S_DEMISE_T16_S2.prg \
  --out spys-demise/extract/data
```

Needs repo `tools/cpu6502.py` (NMOS 6502, no undocumented opcodes — enough:
the loader/depacker uses only documented ops). No VICE/KERNAL needed; the
run stops at the first KERNAL call.

## Outputs (`data/`)

* `manifest.json`, `basic.txt` — directory + stubs
* `*.prg` — raw files (last-sector taken whole; trailing pad kept)
* `docs.txt` — full LOADSTAR briefing (game rules)
* `unpacked.bin` — 64K RAM snapshot at first KERNAL call
* `entry.asm` — `$7F00` init + `$8000` setup disassembly

## Next for `sd-web`

Disassemble `$8000+` for floor/building tables, elevator+KGB AI, collision,
cryptogram/score/timer, `$DC00` input, SID. Reimplement as headless JS engine
(`sd-web/src/engine/`) + canvas UI, same split as `trans_port_kit`/`web`.
