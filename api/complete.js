export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { image, tasks, language } = req.body;
        
        const prompt = language === 'de' 
            ? `Löse folgende Aufgaben: ${tasks}\n\nFORMATIERUNG:\n- Verwende EXAKTE Nummerierung vom Arbeitsblatt\n- Format: "Aufgabe 1) a) b)" oder "1. 2. 3."\n- NUR direkte Antworten - KEINE Erklärungen\n- KEINE Einleitungssätze`
            : `Solve these tasks: ${tasks}\n\nFORMATTING:\n- Use EXACT numbering from worksheet\n- Format: "Task 1) a) b)" or "1. 2. 3."\n- ONLY direct answers - NO explanations`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://host.ogcraftnet.vip/worksheets.html'
            },
            body: JSON.stringify({
                model: 'google/gemma-3-27b-it:free',
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { type: 'image_url', image_url: { url: image } }
                    ]
                }],
                temperature: 0.2
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('OpenRouter error:', error);
            return res.status(response.status).json({ error: 'API failed' });
        }

        const data = await response.json();
        return res.status(200).json({ result: data.choices[0].message.content });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
