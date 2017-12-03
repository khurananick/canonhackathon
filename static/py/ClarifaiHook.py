import requests
from clarifai.rest import ClarifaiApp
#sudo pip install requests  Clarifai
 

DataURL = requests.get("https://a64a62cd.ngrok.io/images/new").text

for x in eval(DataURL):
    urlSRC  = 'https://a64a62cd.ngrok.io/images/%s' % x["id"]
    urlPost = 'https://a64a62cd.ngrok.io/images/%s/update' % x["id"] 
    headers = {'content-type': 'application/json'}
    app     = ClarifaiApp(api_key='aea0de066b5b4319bee17244a7060ff2')
    model   = app.models.get("general-v1.3")
    result  = model.predict_by_url(url=urlSRC)
    data    = dict([ [x["name"], x["value"]] for x in  result["outputs"][0]["data"]["concepts"]])
    params  = {'sessionadata': json.dumps(data), 'platformId': 1}
    requests.post(urlPost, params=params, headers=headers)


# var child;      
#       var pwdir         = path.resolve(process.cwd(),"../CobaltRCX/Py")
#       var shellScrpt    = "cd " +  pwdir + "; python "+ pwdir +"/ClarifaiHook.py ";