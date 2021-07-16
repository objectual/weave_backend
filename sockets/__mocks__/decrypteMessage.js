
var crypto = require("crypto");
var path = require("path");
const fs = require("fs");
let toDecrypt = process.argv[2]
var decryptStringWithRsaPrivateKey = function (toDecrypt, relativeOrAbsolutePathtoPrivateKey) {
    var absolutePath = path.resolve(relativeOrAbsolutePathtoPrivateKey);
    var privateKey = fs.readFileSync(absolutePath, "utf8");
    var buffer = Buffer.from(toDecrypt, "base64");
    var decrypted = crypto.privateDecrypt({
        key: privateKey,
        passphrase: 'We@vE', // KEEP THIS A SECRET
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
    }, buffer);
    console.log("Decrypted: ", decrypted.toString())
    return decrypted.toString("utf8");
};
console.log(decryptStringWithRsaPrivateKey(toDecrypt, process.argv[3]))