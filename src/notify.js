/**
 * Sends a Telegram message to the site owner when a contact form is submitted.
 *
 * Optional: only active when both TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are
 * set. Failures are logged and swallowed — the message is already saved in
 * the database, so a Telegram outage must not fail the visitor's request.
 */
export async function notifyNewMessage(msg) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  // Plain text (no parse_mode) so visitor input can't inject formatting/links.
  const text = [
    "📩 New message from your portfolio",
    "",
    `From: ${msg.name}${msg.email ? ` <${msg.email}>` : ""}`,
    "",
    msg.message,
  ].join("\n");

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.slice(0, 4000),
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      // Don't log the URL — it contains the bot token.
      console.error(`[notify] Telegram API responded ${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[notify] Telegram request failed: ${err.name}`);
    return false;
  }
}
