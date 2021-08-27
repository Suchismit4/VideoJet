const fs = require('fs')
const {
    promisify
} = require('util')
const path = require("path"); 
const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)

let users = [
    {
        email: 'suchismit4@gmail.com',
        password: 'abcd1234'
    },
    {
        email: 'manka1234@gmail.com',
        password: 'mankaOP'
    }
];

const key = "kuz*TSbT2mCK+tMGmL7s7hr8#n&gmtmJ@8SgspF$WRRunNR!L-_?x2ekWVcX3M?vKPwQwzm-nr?GzEVe_dweWzANe9xLjbK$W+?#!ZC!M_EU%DtSs4zMu-MLRV!+SRyR&$nxQpBCdgc+T_@9$X$$syQbx_&9NkGV9tuP6Dfz52HmcLxuT%6%fgb7Tkqg3mE2FH*5AsC9De8tU^rsH2%WDSPxwh_V=JDh864G4hvh!+bTV?!BEjCuLXW3fEhH4ExBy*29%+#NduDA2trvPkTew_r_73h$wt#8!Xj+U+tBfd*k!2Lx8!qrSZu6eS#^j%HXV2Ps?Yv6Vz#925BeYGwxB%-jYkS3U_2@SwtXaCmYnWk$Fx^xMhFWeH4P45_fvMTG_ABFkGnu+Kf2byyqEXPq4tXu+yDPDkdkVD56zN&Hp_6YrsAJ$wBWD%DCaqx@6M!nMDVhY#-Vce=bj+u&#JEus9HS*?T!P2=uX?=MQ7BNXU3TR9F?Np^$wLA+Wg*etyhxmh2d9#M!Fc+xFUK7BPKYZF+-bHa+*$fnLbL25%j+bHFntgTW3Q_%gUfVd3FbZGgkv&g&&G2@rXez3jUc^EPT5j5MXbPZL9+w$a%u&fqvPnQNTVnFSCn8#ue3tZsR*PngTD3VMQm2&Rbhe5-WepSaP=utTh#JngUj9UAUU99BSEU-PP?3ca8qhyf3hnNmZJG26UzG=f-T8gYX#kyhtqndGELDdcjjJWkL2JmZ9XT3b-q%Y@e8qhJ+NK?AfvcgQD389RK2WMpz?!QAYb+L3787RGK!@BY&PaBBW#RDJeGRCcKP9H+8j%fPBjRZN-xWKux*s+@Bcv-CXDRS^NUs4C!-5r=xwa^TKMUHMSvqKzv=-h5ad@Qnsw6bnw*eQtd%VX^ZUAh52f3?&Ka$W2kx!Nyve^9BVHEBzzS+w24XWrR4LFV^=78ZKqjtDJ5gs5E6XL5L35CS=E=_37aj9CT=V+5b$K4Ltcyz28#YHVYd_dKa!ecH4w-Ev9Uw=^KDc_$+FqKy";

const UpdateUsers = async () => {
    const data = await readFile('./db/users.json', 'utf-8');
    obj = JSON.parse(data);
    users = obj.users;
}

const manager = {
    CheckLogin: async (stack) => {
        UpdateUsers();
        const user = users.find(o => o.email == stack.body.email);
        if(user == undefined) { 
            return false; 
        }else if(user.password === stack.body.password){
            return true;
        }
        return false;
    },
    CheckAdmin: (stack) => {
        if(stack.ak === key) {
            return true;
        }
    }
}

module.exports = {
    manager
}