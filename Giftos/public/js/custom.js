
try {
     //======header usericon dropdown menu session
     const userIcon = document.getElementById('user-name');
     const dropdownMenu = document.getElementById('dropdown-menu');
   
     userIcon.addEventListener('click', () => {
       // Toggle the dropdown menu visibility
       dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
     });
   
     // Close the dropdown if clicked outside
     document.addEventListener('click', (event) => {
       if (!userIcon.contains(event.target) && !dropdownMenu.contains(event.target)) {
         dropdownMenu.style.display = 'none';
       }
     });
        //end dorpdown menu session
} catch (error) {
  console.log('error in user dorpdown menu' ,error);
  console.error(error.message);
}


     
//single prodect details image change
function change_image(image){

  var container = document.getElementById("main-image");

 container.src = image.src;
}

//product zoom fucntinality
const productImage = document.querySelector('.product-image');
const zoomImage = document.querySelector('.zoom-img');

productImage.addEventListener('mousemove',function(e) {
  // const x = e.clientX - productImage.offsetLeft;
  // const y = e.clientY - productImage.offsetTop;

  // // const xPercent = (x / productImage.offsetWidth) * 100;
  // // const yPercent = (y / productImage.offsetHeight) * 100;

  // const xPercent = Math.min(Math.max((x / productImage.offsetWidth) * 100, 0), 100);
  // const yPercent = Math.min(Math.max((y / productImage.offsetHeight) * 100, 0), 100);
  // console.log(`Transform Origin: ${xPercent}% ${yPercent}%`);

  const rect = productImage.getBoundingClientRect(); // Get bounding box
  const x = e.clientX - rect.left; // Cursor X relative to the container
  const y = e.clientY - rect.top;  // Cursor Y relative to the container

  // Calculate percentages and clamp between 0 and 100
  const xPercent = Math.min(Math.max((x / rect.width) * 100, 0), 100);
  const yPercent = Math.min(Math.max((y / rect.height) * 100, 0), 100);

  // console.log(`Transform Origin: ${xPercent}% ${yPercent}%`); // Debug log



  zoomImage.style.transformOrigin = `${xPercent}% ${yPercent}%`;
  zoomImage.style.transform = 'scale(2)'; // Adjust the scale for the zoom effect
});

productImage.addEventListener('mouseleave', function() {
  zoomImage.style.transform = 'scale(1)'; // Reset the zoom when the mouse leaves
});



                
