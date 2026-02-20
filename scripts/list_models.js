
const apiKey = process.env.VITE_GOOGLE_API_KEY || 'AIzaSyBu8Xa1FrLRjxQ_2sq478CuqngETLKnSQY';

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    console.log('Fetching models...');
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.models) {
            const models = data.models
                .filter(m => m.name.includes('gemini') && m.supportedGenerationMethods.includes('generateContent'))
                .map(m => m.name);

            console.log('All Gemini Models:');
            models.forEach(name => console.log(name));
        } else {
            console.log('Error:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

listModels();
