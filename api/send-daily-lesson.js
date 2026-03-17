export default async function handler(req, res) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
  const dayName = days[now.getDay()];
  const dateStr = now.toLocaleDateString('he-IL');

  const topicMap = {
    Sunday: 'Business/Trading 📈',
    Monday: 'Daily life ✈️',
    Tuesday: 'Funny story 😄',
    Wednesday: 'Dialogue between two people 🗣️',
    Thursday: 'News/Technology 💻',
    Friday: 'Weekly review 📋',
    Saturday: null,
  };

  if (dayName === 'Saturday') {
    return res.status(200).json({ message: 'Rest day - no lesson on Saturday' });
  }

  const prompt = `Today is ${dayName}, ${dateStr}.

You are an English tutor bot that creates daily structured lessons for a Hebrew speaker at B1-B2 level.
Student interests: stock trading, business, technology, e-commerce.

Generate a complete daily lesson with ALL these sections:

### 1. 📚 7 New Words (4 B1 + 3 B2)
Format: 🟢 **B1 — word** /pronunciation/ — תרגום עברי
"Example sentence with the **word** in bold."

### 2. 🧩 3 Chunks (2 B1 + 1 B2)
Format: 🟢 **B1 — chunk** — תרגום עברי
"Example with **chunk** in bold."

### 3. 💬 1 Idiom
Format: 🔵 **B2 — idiom** — משמעות בעברית
"Example sentence."
Brief cultural note.

### 4. 📖 Daily Story (5-7 sentences)
Topic: ${topicMap[dayName]}
Use ALL words/chunks/idiom in **bold**. After each English sentence add Hebrew translation.

### 5. ✏️ 3 Fill-in-the-Blank Exercises
Each with 4 options (a/b/c/d).

### 6. 🔄 Translate This Sentence
One Hebrew sentence using 2-3 of today's words. Ask student to translate to English.

Tone: friendly, encouraging, use emojis. Explanations in Hebrew.`;

  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'claude-opus-4-6', max_tokens: 4000, messages: [{ role: 'user', content: prompt }] }),
    });

    const claudeData = await claudeRes.json();
    const lessonText = claudeData.content[0].text;

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'English Tutor <onboarding@resend.dev>',
        to: ['yaniv1157@gmail.com'],
        subject: `📚 שיעור האנגלית שלך להיום — ${dateStr}`,
        text: `שלום יניב!\n\nשיעור האנגלית היומי שלך מוכן 🎯\n\nלחץ כאן להיכנס לשיעור:\nhttps://english-agent-six.vercel.app\n\n---\n\n${lessonText}`,
      }),
    });

    const emailData = await emailRes.json();
    res.status(200).json({ success: true, emailId: emailData.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
