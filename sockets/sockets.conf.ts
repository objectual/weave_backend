import { UserService } from "../app/http/services/user.service";
import { ValidateBlocked } from "../app/http/validators/connection.validate";

export async function userConfigure(socket) {
    return new Promise(async (resolve, reject) => {
        //this socket is authenticated, we are good to handle more events from it.
        const userService = new UserService()
        const user = await userService.findOneAdmin({ id: socket['decoded_token'].id, blocked: false }).catch(e => reject(e.message))
        resolve(user)
    })
}

export async function userBlockedListConfigure(socket): Promise<{ blockedByMe: any[], blockedByOthers: any[] }> {
    return new Promise((resolve, reject) => { 
        // Attaches blocked users in both list to the socket
        const validateBlocked = new ValidateBlocked();
        validateBlocked.userInBlockList(socket['user'].id, {
            error: (msg) => reject(msg),
            next: (blockedObject) => {
                // 'blockedByMe' // users I blocked
                // 'blockedByOthers' // users who blocked me 
                if (blockedObject != null) { 
                    resolve({ blockedByMe: blockedObject.blockedByMe, blockedByOthers: blockedObject.blockedByOthers })
                } else {
                    resolve({ blockedByMe: [], blockedByOthers: [] })
                }
            }
        })
    })
}