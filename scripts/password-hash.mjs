import { scryptSync, randomBytes } from "node:crypto";
import { Writable } from "node:stream";
import { createInterface } from "node:readline/promises";
let mute = false;
const output = new Writable({
  write(chunk, encoding, callback) {
    if (!mute) process.stdout.write(chunk, encoding);
    callback();
  },
});
const rl = createInterface({
  input: process.stdin,
  output,
  terminal: !!process.stdin.isTTY,
});
process.stdout.write("Contraseña nueva (mínimo 12 caracteres): ");
mute = true;
const password = await rl.question("");
mute = false;
rl.close();
if (password.length < 12) {
  console.error("\nUsa al menos 12 caracteres.");
  process.exit(1);
}
const salt = randomBytes(16).toString("hex");
console.log(
  `\nscrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`,
);
