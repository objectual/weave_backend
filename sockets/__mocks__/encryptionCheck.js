
var crypto = require("crypto");
var path = require("path");
const fs = require("fs");
const openpgp = require('openpgp');

// node encryptionCheck.js <MESSAGE> <PATH TO KEY>

// RSA ENCRYPTION
// var encryptStringWithRsaPublicKey = function (toEncrypt, relativeOrAbsolutePathToPublicKey) {
//     var absolutePath = path.resolve(relativeOrAbsolutePathToPublicKey);
//     var publicKey = fs.readFileSync(absolutePath, "utf8");
//     var buffer = Buffer.from(toEncrypt);
//     var encrypted = crypto.publicEncrypt({
//         key: publicKey,
//         padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
//         oaepHash: "sha256",
//     }, buffer);
//     return encrypted.toString("base64");
// };

// console.log(encryptStringWithRsaPublicKey(process.argv[2], process.argv[3]))


// node encryptionCheck.js <MESSAGE> <PATH TO PRIVATE KEY>

// PGP ENCRYPTION
(async () => {
    const passphrase = "We@vE"
    const plaintext = process.argv[2];
    const relativeOrAbsolutePathToPrivateKey = process.argv[3]

    let absolutePathToPrivateKey = path.resolve(relativeOrAbsolutePathToPrivateKey);
    let privateKey = await openpgp.readPrivateKey({ armoredKey: fs.readFileSync(absolutePathToPrivateKey, "utf8") });

    let relativeOrAbsolutePathToPublicKeys = [
        "./keys/923343664550.pub",
        "./keys/923323070980.pub"
    ]
    let absolutePath = relativeOrAbsolutePathToPublicKeys.map(keyPath => path.resolve(keyPath))
    let publicKeys = await Promise.all(absolutePath.map(async keyPath => {
        let publicKeyArmored = fs.readFileSync(keyPath, "utf8");
        let publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored })
        return publicKey;
    })).then(keys => {
        return keys
    })


    privateKey = await openpgp.decryptKey({
        privateKey,
        passphrase
    }); 
    const encrypted = await openpgp.encrypt({
        message: await openpgp.createMessage({ text: plaintext }), // input as Message object
        encryptionKeys: publicKeys,
        signingKeys: privateKey // optional - This is the key of user who signed this message. For signature verification
    });
    console.log(encrypted); // '-----BEGIN PGP MESSAGE ... END PGP MESSAGE-----'
    console.log("BTOA: ", Buffer.from(encrypted).toString("base64"))
})();
