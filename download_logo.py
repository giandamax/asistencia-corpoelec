import urllib.request

url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Logo_CORPOELEC_%28Venezuela%29.jpg/800px-Logo_CORPOELEC_%28Venezuela%29.jpg'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response, open('logo.jpg', 'wb') as out_file:
        data = response.read()
        out_file.write(data)
    print("Download successful")
except Exception as e:
    print(f"Error: {e}")
