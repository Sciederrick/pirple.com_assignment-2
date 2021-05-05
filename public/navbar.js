const target = document.querySelector("button.bars")
const targetIcon = document.querySelector("i.fas")
const navLinks = document.querySelector("ul.menu")
target.addEventListener('click', (e)=>{
    e.preventDefault()
    navLinks.classList.toggle("navMobile")
    if(targetIcon.classList.contains("fa-bars")){
        targetIcon.classList.replace("fa-bars", "fa-times")
    }else if(targetIcon.classList.contains("fa-times")){
        targetIcon.classList.replace("fa-times", "fa-bars")
    }
})