const fs = require("fs");
const crypto = require('crypto');
const http = require("http");

const server = http.createServer();
const port = 8080;
const host = 'localhost';

const { Client } = require('pg');

const client = new Client({
    user: 'postgres', 
    password: 'root', 
    database: 'application-image',
    port : 5432
});

client.connect()
.then(() => {
    console.log('Connected to database');
})
.catch((e) => {
    console.log('Error connecting to database');
    console.log(e);
});

let lastSessionId = 0;
let sessions = [];

server.on("request", async(req,res)=>{
    //console.log(req.method + ":" + req.url);
//  DEBUT GESTION COOKIE
    let hasCookieWithSessionId = false;
    let sessionId;
    if(req.headers['cookie'] !== undefined){
        let cookieStartsWithSessionId = req.headers['cookie'].split(';').find(item => item.trim().startsWith('session-id'));
        if (cookieStartsWithSessionId !== undefined){
            sessionId = parseInt(cookieStartsWithSessionId.split('=')[1]);
            if (sessionId){
                hasCookieWithSessionId = true;
                /*sessions[sessionId].isConnected=false;
                sessions[sessionId].isConnected=true;
                sessions[sessionId].username='bob';*/
            }
            //console.log(`session : ${sessionId}`);
        }
    }else if (!hasCookieWithSessionId){
        lastSessionId++
        sessionId = lastSessionId;
        res.setHeader('Set-Cookie', `session-id=${lastSessionId};Path=/`);
        sessions[lastSessionId] = {
            'isConnected' : false,
            'username' : ''
        }
    }
    console.log(sessions[sessionId]);
//  FIN GESTION COOKIE
    if(req.url.startsWith('/public/')){
        try {
            const page = fs.readFileSync('.' + req.url);
            res.end(page);
        } catch (error) {
            console.log(error);
            res.statusCode = 404;
            res.end("<!DOCTYPE html><html lang='fr'><head><meta charset='UTF-8'></head><body><h1>404 Not Found</h1>La ressource demandée n'existe pas !</body></html>");
        }
    }else if(req.method === 'GET' && req.url === "/mur"){
        let css = '<link rel="stylesheet" href="/public/style.css">';
        let html = '<!DOCTYPE html><html><head>'+css+'</head><body>';
        html += (!sessions[sessionId].isConnected)?`<header class='right'>
                        <a href='/signup'>Signup</a><span> | </span><a href='/signin'>Signin</a>
                    </header>`:`<header><span>Welcome, ${sessions[sessionId].username} !</span><a class='right' href='/signout'>Deconnexion</a></header>`;
        html+='<a href="/">index</a><div class="center">';
        html+='<h1>Le mur d\'image</h1><div class="murImage">';
        const sqlResult = await client.query('SELECT fichier FROM images;');
        //console.log(sqlResult);
        const images = sqlResult.rows.map(row => row.fichier);
        //console.log(images);
        for (let i = 0; i < images.length; i++){
            let id = images[i].split('.')[0].split('e')[1];
            html += '<a href="/page-image/'+ id +'">';
            html += '<img src="/public/images/image'+ id +'_small.jpg"></a>';
            if (sessions[sessionId].isConnected){
                let isLiked = false;
                let isLikedQuery = await client.query(`SELECT * FROM accounts_image_like WHERE id_image = ${id} AND username = '${sessions[sessionId].username}';`);
                if (isLikedQuery.rowCount !== 0){
                    isLiked = true;
                }
                html += (isLiked)?`liked`:`<a href='/like/${id}'>like</a>`;
            }
        }
        html+='</div></div></body></html>';
        res.end(html);
    }else if(req.url.startsWith('/page-image/')){
        let id = req.url.split('/')[2];
        let head = '<link rel="stylesheet" href="/public/style.css"><meta charset="UTF-8">';
        let html = '<!DOCTYPE html><html><head>'+head+'</head><body>';
        html +='<a href="/mur">mur</a><div class="center">';
        //ajout de l'image ayant l'id $id dans la DB
        let sqlResultImage = await client.query(`SELECT * FROM images WHERE id = ${id};`);
        let nomImage = sqlResultImage.rows.map(row => row.nom);
        let fichierImage = sqlResultImage.rows.map(row => row.fichier);
        html += `<img src="/public/images/${fichierImage}" width="300"/><h3>${nomImage}</h3><h4>Commentaires :</h4>`;
        //commentaires
        let sqlResultComm = await client.query(`SELECT * FROM commentaires WHERE id_image = ${id};`);
        let commentairesImage = sqlResultComm.rows.map(row => row.texte);
        console.log(commentairesImage);
        //faire une boucle for qui va boucler sur commentaireImage et qui va rajouter
        //commentaireImage[i] à html.
        for (let i = 0; i < commentairesImage.length; i++){
            console.log(commentairesImage[i]);
            /*if (commentairesImage[i] === undefined){
                html += "";
            }else{*/
            html += "-- "+commentairesImage[i]+" --<br/>";
            //}
        }
        //html += commentaires[id];
        html+='<form action="/image-description/' + id + '" method="POST"><label for="Commentaire">Votre commentaire :';
        html+='<input type="text" name="Commentaire"></label><input type="submit" name="Envoyer un commentaire">';
        html+='</form></div>';
        const sizeOfImages = (fs.readdirSync('./public/images').length)/2;
        id=parseInt(id);
        if (id>1 && id<sizeOfImages){
            html += '<a class="left" href="/page-image/'+ (id-1) +'"><img src="/public/images/image'+(id-1)+'_small.jpg"/></a>';
            html += '<a  class="right" href="/page-image/'+ (id+1) +'"><img src="/public/images/image'+(id+1)+'_small.jpg"/></a>';          
        }else if(id == 1){
            html += '<a class="right" href="/page-image/2"><img src="/public/images/image2_small.jpg"/></a>';
        }else if(id == sizeOfImages){
            html += '<a class="left" href="/page-image/'+ (id-1) +'"><img src="/public/images/image'+(id-1)+'_small.jpg"/></a>';
        }else{
            res.end(fs.readFileSync('./index.html'));
            return;
        }
        html+="<script src='/public/page-image.js'></script>"
        html+='</body></html>';
        res.end(html);
    }else if(req.method === "POST" && req.url.startsWith("/image-description/")){
        let id = req.url.split("/")[2];
        console.log(id);
        let data;
        req.on("data", (dataChunk)=>{
            data += dataChunk.toString();
            console.log(`dataChunk : ${data}`);
        })
        req.on("end", async()=>{
            let parametres = data.split("&");
            let Commentaire = parametres[0].split("=")[1];
            console.log(`Image Number : ${id} ; Commentaire : ${Commentaire}`);
            /*if (commentaires[id] === undefined){
                commentaires[id] = "-- " + Commentaire + " --<br>";
            }else{
                commentaires[id] += "-- " + Commentaire + " --<br>";
            }*/
            await client.query(`INSERT INTO commentaires(id_image, texte) VALUES (${id}, '${Commentaire}');`);
            console.log('Commentaire added');
            res.statusCode = 302;
            let redirection = '/page-image/'+id;
            res.setHeader('Location', redirection);
            res.end();
        })
    }else if(req.method === 'GET' && req.url.startsWith('/like/')){
        let imageId = parseInt(req.url.split('/')[2]);
        //console.log('a user wants to like image :'+imageId);
        //      let getIdAccount = await client.query(`SELECT id FROM accounts WHERE username = '${sessions[sessionId].username}';`);
        //      let idAccount = getIdAccount.rows[0].id;
        //console.log(idAccount);
        let insertQuery = await client.query(`INSERT INTO accounts_image_like (username, id_image) VALUES ('${sessions[sessionId].username}', '${imageId}');`);
        //console.log('a user likes image :'+imageId);
        res.statusCode = 302;
        res.setHeader('Location', '/mur');
        res.end();
    }else if(req.method === 'GET' && (req.url === '/signin' || req.url === '/signup')){
        let up = (req.url === '/signup')?true:false;
        res.end(generateSignFormPage(up));
        // let html = `<!DOCTYPE html>
        //             <html lang="fr">
        //                 <head>
        //                     <title>${signwhat}</title>
        //                     <link rel="stylesheet" href="/public/style.css">
        //                 </head>
        //                 <body>
        //                     <h1>${signwhat}</h1>
        //                     <form method='POST' action='${req.url}'>
        //                         <label for="username">Username</label><input type="text" placeholder="Enter Username" name="username" required><br/>
        //                         <label for="password">Password</label><input type="password" placeholder="Enter Password" name="password" required><br/>
        //                         <input type="submit" value='${signwhat}'><br>
        //                         <a href='${signwhat2}'>${signwhat2}</a>
        //                     </form>
        //                 </body>
        //             </html>`;
        // res.end(html);
    }else if(req.method === 'GET' && req.url === '/signout'){
        sessions[sessionId].isConnected = false;
        sessions[sessionId].username = '';
        res.statusCode = 302;
        res.setHeader('Location', '/');
        res.end();
    }else if(req.method === 'POST' && req.url === '/signup'){
        let data;
        req.on("data", (dataChunk)=>{
            data = dataChunk.toString();
            console.log(`datachunk : ${dataChunk}`);
        })
        req.on('end', async ()=>{
            let params = data.split('&');
            let username = params[0].split('=')[1];
            let password = params[1].split('=')[1];
            console.log(`décodé : username : ${username}; password : ${password}`);
            let findQuery = `SELECT * FROM accounts WHERE username = '${username}';`
            let findResult = await client.query(findQuery);
            if (findResult.rows.length === 0){
                // no user found
                let salt = crypto.randomBytes(16).toString('hex');
                let hash = crypto.createHash('sha256').update(password).update(salt).digest('hex');
                let insertQuery = `INSERT INTO accounts (username, hash, salt) VALUES ('${username}', decode('${hash}','hex'), decode('${salt}','hex'))`;
                await client.query(insertQuery);
                res.end(`<html><body><h1>Sign Up is a Success</h1><a href="/signin">You can sign in now !</a></body></html>`);
            }else{
                res.end(`<html><body><h1>Sign Up Failed</h1><div>Username already signed up!</div><a href="/signup">Retry</a></body></html>`);
            }
        })
    }else if(req.method === 'POST' && req.url === '/signin'){
        let data;
        req.on("data", (dataChunk)=>{
            data = dataChunk.toString();
          //  console.log(`datachunk : ${dataChunk}`);
        })
        req.on('end', async ()=>{
            let params = data.split('&');
            let username = params[0].split('=')[1];
            let password = params[1].split('=')[1];
            console.log(`décodé : username : ${username}; password : ${password}`);
            let findQuery = `SELECT username, encode(salt, 'hex') as salt, encode(hash, 'hex') as hash FROM accounts WHERE username = '${username}';`
            let findResult = await client.query(findQuery);
            if (findResult.rows.length !== 0){
                // if user found
                let salt = findResult.rows[0].salt;
                let trueHash = findResult.rows[0].hash;
                let computedHash = crypto.createHash('sha256').update(password).update(salt).digest('hex');
                if (computedHash === trueHash) {
                    sessions[sessionId].isConnected = true;
                    sessions[sessionId].username = username;
                    res.end(`<html><body><h1>Sign In Success</h1><h1>Welcome, ${username}!</h1><a href='/mur'>Page d'Accueil(mur)</a></body></html>`);
                }else{
                    res.end(`<html><body><h1>Sign In Failed</h1><div>Wrong password !</div><a href="/signin">Retry</a></body></html>`);
                }
            }else{
                res.end(`<html><body><h1>Sign In Failed</h1><div>Wrong username !</div><a href="/signin">Retry</a></body></html>`);
            }
        })
    }else{
        let html = '<!DOCTYPE html><html lang="fr"><head><title>Document</title><link rel="stylesheet" href="/public/style.css"></head><body>';
            html += (!sessions[sessionId].isConnected)?`<header class='right'>
                        <a href='/signup'>Signup</a><span> | </span><a href='/signin'>Signin</a>
                    </header>`:`<header><span>Welcome, ${sessions[sessionId].username} !</span><a class='right' href='/signout'>Deconnexion</a></header>`;
            html += `<div class="center"><img src="/public/logo.png"><h1>Mon Mur d\'Images</h1>`;
        const sqlResult = await client.query("SELECT fichier FROM images ORDER BY date DESC LIMIT 3;");
        const fichiersImage = sqlResult.rows.map(row => row.fichier);
        //console.log(fichiersImage);
        for (let i = 0; i < fichiersImage.length; i++){
            //console.log(fichiersImage[i]);
            let id = fichiersImage[i].split('.')[0].split('e')[1];
            html += `<a href="/page-image/${id}"><img src="/public/images/${fichiersImage[i]}" width="200"/></a>`;
        }
        //SELECT * FROM images WHERE id_auteur = 1; les images de Marcel Duchamp
        /*.then((response) => {
            response.rows.forEach(element => {
                html += element.id;
            });;
        })
        .catch((e) => {
            console.log('Error querrying the database');
            console.log(e);
        });*/
        html += '<br/><a id="VoirMurButton" href="/mur">Toutes les images</a></div></body></html>';
        res.end(html);
    }
})

server.listen(port, ()=>{
    console.log(`Server running at http://${host}:${port}`);
});

function generateSignFormPage(up) {
    let signWhat = up ? 'signup' : 'signin';
    return `<html lang="fr"><head><title>${signWhat}</title><link rel="stylesheet" href="/public/style.css"></head><body>
            <h1>${signWhat}</h1>
            <form action='/${signWhat}' method="POST">
                <label for="username">Username: </label>
                <input type="text" name="username" id="username" required>
                <label for="username">Password: </label>
                <input type="password" name="password" id="password" required>
                <input type="submit" value="${signWhat}!">
            </form>
            </body></html>`;
}