
var crypto = require("crypto");
var path = require("path");
const fs = require("fs");
const openpgp = require('openpgp');

// node dencryptMessage.js <MESSAGE> <PATH TO KEY>
// RSA DECRYPTION
// var decryptStringWithRsaPrivateKey = function (toDecrypt, relativeOrAbsolutePathtoPrivateKey) {
//     var absolutePath = path.resolve(relativeOrAbsolutePathtoPrivateKey);
//     var privateKey = fs.readFileSync(absolutePath, "utf8");
//     var buffer = Buffer.from(toDecrypt, "base64");
//     var decrypted = crypto.privateDecrypt({
//         key: privateKey,
//         passphrase: 'We@vE', // KEEP THIS A SECRET
//         padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
//         oaepHash: "sha256",
//     }, buffer);
//     console.log("Decrypted: ", decrypted.toString())
//     return decrypted.toString("utf8");
// };
// console.log(decryptStringWithRsaPrivateKey(process.argv[2], process.argv[3]))


// node dencryptMessage.js <MESSAGE> <PATH TO PRIVATE KEY> <PATH TO PUBLIC KEY OF SIGNEE> 
// PGP DECRYPTION
(async () => {
    const passphrase = "We@vE"

    const relativeOrAbsolutePathToPrivateKey = process.argv[3]
    let absolutePathToPrivateKey = path.resolve(relativeOrAbsolutePathToPrivateKey);
    let privateKey = fs.readFileSync(absolutePathToPrivateKey, "utf8");
    privateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }),
        passphrase
    });

    const relativeOrAbsolutePathToPublicKey = process.argv[4]
    let absolutePathToPublicKey = path.resolve(relativeOrAbsolutePathToPublicKey);
    let publicKey = fs.readFileSync(absolutePathToPublicKey, "utf8");
    publicKey = await openpgp.readKey({ armoredKey: publicKey });

    let encMessage = Buffer.from(process.argv[2], "base64").toString('ascii')

    //  `-----BEGIN PGP MESSAGE-----\n\nwV4DPH4fzWe4kSsSAQdAWgF7cBeB+qA6v+yLL9wNwGs6GkJVgz21TKDKtxGq\nnToww0L4k6SR03EGTNfW5UM2gKbaodPLEHWzae7bwQh/14yAzdkMvIZI+QCN\nxfqaxSrUwV4DTclDcacM2JYSAQdAHTDB0i6IuLaWq7sjnNqgKYyohhuFDjsD\nRE5Ic5SdDiow7L5bAlxboApMyZ9fVfLevd1gW9+rtsqDIivSAJc0xBYaLDE0\n/NctmcNc/+6k8VR90sAAAeJZs9BzX6vZlSEueljkTw1eHv9Lee6SzLoUlK2M\nrVE0M0ZI8N7akcrOxa6KWWrTzuOyvR8dmYluqx9fD1fM5tVQ3cbSE4CVNO3K\nUQaBtpBHdpztqphkMeLW54iikoS2xLwFbCBHES7Ov9rG7J6O5j8V2rcp5jf7\nZEhm3HKJ7NTma1CdTzjPR0YU19jNY9n4VxhgZWJlGSWLrOHrqnQ3HU9hrjRM\nRZM2fIyxfiqK7UH9ibUJwMeGPH0iymrlfpJh\n=NeQK\n-----END PGP MESSAGE-----`

    // Buffer.from(process.argv[2], "base64")

    const message = await openpgp.readMessage({
        armoredMessage: encMessage// parse armored message
    }); 

    const { data: decrypted, signatures } = await openpgp.decrypt({
        message,
        verificationKeys: publicKey, // optional - This is public key of who signed this message.
        decryptionKeys: privateKey
    });
    console.log(decrypted); // 'Hello, World!'
    // check signature validity (signed messages only)
    try {
        await signatures[0].verified; // throws on invalid signature
        console.log('Signature is valid');
    } catch (e) {
        throw new Error('Signature could not be verified: ' + e.message);
    }
})();
