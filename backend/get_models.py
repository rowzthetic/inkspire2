import requests

try:
    models = requests.get('https://openrouter.ai/api/v1/models').json()['data']
    matches = [m['id'] for m in models if 'flux' in m['id'].lower() or 'schnell' in m['id'].lower()]
    print("MATCHING MODELS:")
    for m in matches:
        print(m)
except Exception as e:
    print("Error:", e)
