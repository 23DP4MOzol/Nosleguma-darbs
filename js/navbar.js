// Hamburger toggle
const hamburgerBtn=document.getElementById("hamburgerBtn");
const navbarLinks=document.querySelector(".navbar-links");
if(hamburgerBtn && navbarLinks){
  hamburgerBtn.addEventListener("click",()=>{
    navbarLinks.classList.toggle("active");
    if(navbarLinks.style.display==='flex') navbarLinks.style.display='none';
    else if(window.innerWidth<=768) navbarLinks.style.display='flex';
  });
}
