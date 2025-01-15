
document.getElementById("logout").addEventListener("click",() =>{
  console.log('logout clicked');
    Swal.fire({
        title: 'Are you sure?',
        text: "You Really want to log out!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, log out!'
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = '/admin/adminlogout';
        }
      })
      return false
})
