// MODULE
const argon2 = require("argon2");

// PASSWORD PEPPER
const PEPPER = process.env.PASSWORD_PEPPER || "";

if (PEPPER && PEPPER.length < 32) {
  throw new Error("PASSWORD_PEPPER must be at least 32 characters long.");
}

const secret = PEPPER ? Buffer.from(PEPPER, "utf8") : undefined; 

// ARGON2 SETTINGS
const OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 47104, // Approximately 46MB
  timeCost: 2, // Two processing passes
  parallelism: 1, // One processing lane
};

const hashOptions = () =>
  secret ? { ...OPTIONS, secret } : OPTIONS;

const verifyOptions = () =>
  secret ? { secret } : undefined;

const MAX_PASSWORD_LENGTH = 128;

// CHECK IF A HASH USES ARGON2
const isArgon2 = (hash) =>
  typeof hash === "string" && hash.startsWith("$argon2");

// HASH A PASSWORD
const hashPassword = (plain) =>
  argon2.hash(String(plain), hashOptions());

// DUMMY HASH FOR FAILED LOGIN ATTEMPTS
let dummyHash;

const getDummyHash = async () => {
  if (!dummyHash) {
    dummyHash = await argon2.hash(
      "dummy-password-for-timing",
      hashOptions()
    );
  }

  return dummyHash;
};

// VERIFY A PASSWORD DURING LOGIN
const verifyPassword = async (plain, stored) => { 
  plain = String(plain || "");

  if (!stored || plain.length > MAX_PASSWORD_LENGTH) {
    await argon2
      .verify(
        await getDummyHash(),
        plain.slice(0, MAX_PASSWORD_LENGTH),
        verifyOptions()
      )
      .catch(() => false);

    return { ok: false, needsRehash: false };
  }

  if (!isArgon2(stored)) {
    await argon2
      .verify(await getDummyHash(), plain, verifyOptions())
      .catch(() => false);

    return { ok: false, needsRehash: false };
  }

  try {
    const ok = await argon2.verify(
      stored,
      plain,
      verifyOptions()
    );

    return {
      ok,
      needsRehash: ok && argon2.needsRehash(stored, OPTIONS),
    };
  } catch {
    return { ok: false, needsRehash: false };
  }
};

// BANNED WORDS
const BANNED_WORDS = [
  "password",
  "passw0rd",
  "admin",
  "welcome",
  "letmein",
  "iloveyou",
  "findback",
  "qwerty",
  "asdfgh",
  "zxcvbn",
  "azerty",
  "login",
  "secret",
  "monkey",
  "dragon",
  "football",
  "abc123",
  "unknown",
  "changeme",
  "lostandfound",
  "phinma",
  "idol",
  "user",
  "missyou",
  "mwamwa",
  "baby",
  "love"
];

// CHECK FOR CONSECUTIVE LETTERS OR NUMBERS
const hasSequence = (s, len = 3) => {
  const t = s.toLowerCase();
  let up = 1;
  let down = 1;

  for (let i = 1; i < t.length; i++) {
    const d = t.charCodeAt(i) - t.charCodeAt(i - 1);

    const alnum =
      /[a-z0-9]/.test(t[i]) &&
      /[a-z0-9]/.test(t[i - 1]);

    up = alnum && d === 1 ? up + 1 : 1;
    down = alnum && d === -1 ? down + 1 : 1;

    if (up >= len || down >= len) {
      return true;
    }
  }

  return false;
};

// CHECK FOR THREE IDENTICAL CHARACTERS IN A 
const hasRepeat = (s) => /(.)\1\1/.test(s);

// KEYBOARD PATTERNS
const ROWS = [
  "qwertyuiop",
  "asdfghjkl",
  "zxcvbnm",
  "1234567890",
];

const hasKeyboardRun = (s, len = 3) => {
  const t = s.toLowerCase();

  return ROWS.some((row) => {
    const rev = [...row].reverse().join("");

    for (let i = 0; i + len <= row.length; i++) {
      if (
        t.includes(row.slice(i, i + len)) ||
        t.includes(rev.slice(i, i + len))
      ) {
        return true;
      }
    }

    return false;
  });
};


// CONVERT COMMON SYMBOL SUBSTITUTIONS INTO 
// normalization or leet-speak normalization
const deleet = (s) =>
  s
    .toLowerCase()
    .replace(/@/g, "a")
    .replace(/0/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/3/g, "e")
    .replace(/[$5]/g, "s")
    .replace(/7/g, "t");

// CHECK PASSWORD STRENGTH
const checkPasswordStrength = (pw) => {
  pw = String(pw || "");

  if (pw.length < 8) {
    return "acterPassword must be at least 8 chars.";
  }

  if (pw.length > MAX_PASSWORD_LENGTH) {
    return "Password must be 128 characters or fewer.";
  }

  if (!/[a-zA-Z]/.test(pw)) {
    return "Password must contain at least one letter.";
  }

  if (!/\d/.test(pw)) {
    return "Password must contain at least one number.";
  }

  const normalized = deleet(pw);

  if (
    BANNED_WORDS.some((word) => normalized.includes(word))
  ) {
    return "Password contains a common or prohibited word.";
  }

  if (hasSequence(pw)) {
    return "Password must not contain sequences like abc or 123.";
  }

  if (hasRepeat(pw)) {
    return "Password must not repeat the same character three times in a row.";
  }

  if (hasKeyboardRun(pw)) {
    return "Password must not contain predictable keyboard patterns.";
  }

  return null;
};

// EXPORT FUNCTIONS FOR OTHER FILES
module.exports = {hashPassword, verifyPassword, checkPasswordStrength, MAX_PASSWORD_LENGTH,};
