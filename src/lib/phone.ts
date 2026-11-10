/** Phone display (Document 6, section 16): the backend stores "+91" and ten digits; shown as "+91 98765 43210". */
export function formatPhone(phone: string): string {
  const match = /^\+91(\d{5})(\d{5})$/.exec(phone);
  return match ? `+91 ${match[1]} ${match[2]}` : phone;
}
