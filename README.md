A custom app to pull customer information into Help Scout converstaions.
![alt text](ac-hs-app.png?raw=true "AmeriCommerce Help Scout app.")

**Installation**
1. <a href="https://github.com/AmeriCommerce/rest-api/blob/master/authentication.md#generating-a-token-from-the-admin-console" target="_blank">create an API key in your AmeriCommerce admin panel</a>
2. while logged into Help Scout, go to "Manage > Apps"
2. scroll to bottom, click "Build a Custom App"
3. click "Create App"
4. name the app. ex: "Customer Info" or "AmeriCommerce"
5. set Content Type to "Dynamic Content"
6. set Callback Url to "https://achs.herokuapp.com/WWW.YOURSTORESSLDOMAIN.COM/YOURAPIKEY"
7. set Security Key to any random string.
8. select which mailboxes you want to display customer information in.
9. SAVE.
 


built by Ryan Olson @ <a href="https://www.texasbeardcompany.com" target="_blank">Texas Beard Company</a>