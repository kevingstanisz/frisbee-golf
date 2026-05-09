export async function sendNotification(title: string, message: string) {
  const topic = process.env.NTFY_TOPIC
  if (!topic) {
    console.warn('NTFY_TOPIC not configured, skipping notification')
    return
  }

  try {
    await fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      headers: {
        'Title': title,
        'Priority': 'default',
        'Content-Type': 'text/plain',
      },
      body: message,
    })
  } catch (err) {
    console.error('ntfy error:', err)
  }
}
