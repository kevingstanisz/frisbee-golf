export async function sendNotification(title: string, message: string) {
  const topic = process.env.NTFY_TOPIC
  if (!topic) {
    console.warn('NTFY_TOPIC not configured, skipping notification')
    return
  }

  try {
    const res = await fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      headers: {
        'Title': title,
        'Priority': 'default',
        'Content-Type': 'text/plain',
      },
      body: message,
    })
    if (!res.ok) console.error('ntfy error:', res.status, await res.text())
  } catch (err) {
    console.error('ntfy error:', err)
  }
}
