export function displayDialogue(k, text, onDisplayEnd,isResume = false){
    const dialogueUI = document.getElementById("textbox-container");
    const dialogueText = document.getElementById("dialogue");
    const dialogue = document.getElementById("dialogue");
    const resumeLink = document.getElementById("resume-link");

    dialogueUI.style.display = "block";

    let index = 0;
    let currentText = "";


    if (isResume) {
        resumeLink.style.display = "inline-block";
    } else {
        resumeLink.style.display = "none";
    }


    //adding of sound (when textbox opens)
    k.play("blip", {
        volume: 0.5,
        speed: 1.0,
    });

    const intervalRef = setInterval( () => {
        if(index<text.length){
            currentText+=text[index];
            dialogueText.innerHTML = currentText;

            k.play("typing", {
                volume: 0.1,
                speed: 1,
            });

            index++
            return;
        }
        clearInterval(intervalRef);
    } ,50);




    const closeBtn = document.getElementById("close");

    function onCloseBtnClick(){
        onDisplayEnd();
        dialogueUI.style.display = "none";
        dialogueText.innerHTML = "";
        clearInterval(intervalRef);
        closeBtn.removeEventListener("click", onCloseBtnClick);
    }

    closeBtn.addEventListener("click", onCloseBtnClick);


    //add hotkey function to close textbox 
    const keyListener = k.onKeyPress("enter", onCloseBtnClick);

}


export function setCamScale(k){
    const resizeFactor = k.width()/ k.height();
    if (resizeFactor < 1){
        k.camScale(k.vec2(1));
        return;
    }
    k.camScale(k.vec2(1.5));
}