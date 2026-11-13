// Class codes (US05, US06): 6 characters that are easy to read aloud and type.
// O/0 and I/1 are left out because they look alike.
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const CODE_LENGTH = 6

// `random` returns a number in [0, 1); tests pass a fixed one to get a known code.
export function generateClassCode(random = Math.random) {
  let code = ''
  for (let index = 0; index < CODE_LENGTH; index += 1) {
    code += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)]
  }
  return code
}

// What the student typed → the stored form: no spaces, upper case
export function normalizeClassCode(text) {
  return String(text ?? '').replace(/\s+/g, '').toUpperCase()
}
