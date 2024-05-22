let mainImage = document.querySelector("body > div > img");
let submitButton = document.querySelector("body > div > form > input[type=submit]");
let commentaire = document.querySelector("body > div > form > label > input[type=text]");

mainImage.addEventListener('click',()=>{
    mainImage.width += 10;
});

mainImage.addEventListener('contextmenu',(e)=>{
    mainImage.width -= 10;
    e.preventDefault();
});

document.addEventListener('keyup', ()=>{
    if (commentaire.value === ''){
        submitButton.disabled = true;
    }else{
        submitButton.disabled = false;
    }
});
