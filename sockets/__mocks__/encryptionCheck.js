
var crypto = require("crypto");
var path = require("path");
const fs = require("fs");

// node encryptionCheck.js <MESSAGE> <PATH TO KEY>
var encryptStringWithRsaPublicKey = function (toEncrypt, relativeOrAbsolutePathToPublicKey) {
    var absolutePath = path.resolve(relativeOrAbsolutePathToPublicKey);
    var publicKey = fs.readFileSync(absolutePath, "utf8");
    var buffer = Buffer.from(toEncrypt);
    var encrypted = crypto.publicEncrypt({
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
    }, buffer);
    return encrypted.toString("base64");
};
console.log(encryptStringWithRsaPublicKey(process.argv[2], process.argv[3]))