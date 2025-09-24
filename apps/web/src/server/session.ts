export function getUserName() {
  return process.env.NEXT_PUBLIC_USER_NAME ?? "Zenith";
}
