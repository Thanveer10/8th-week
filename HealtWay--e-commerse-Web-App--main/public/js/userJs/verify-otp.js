// Get the type (signup or edit) from the server-side rendered data
let otpForm = document.getElementById("otp-form");
let type = otpForm.getAttribute('data-type');
console.log("Type =",type)
// Adjust form submission URLs dynamically based on the type

if (type === 'signup') {
    otpForm.action = "/verify-otp";  // For signup
} else if (type === 'edit') {
    otpForm.action = "/verificationForUserAndEmail";  // For profile editing
}

// Countdown timer logic

let countdown = 90;
let countdownInterval = setInterval(() => {
    document.getElementById("countdown").innerText = "You can resend OTP in " + countdown + " seconds";
    countdown--;
    if (countdown < 0) {
        clearInterval(countdownInterval);
        document.getElementById("countdown").innerText = "";
        document.getElementById("resend-btn").style.display = "block";
    }
}, 1000);

// Resend OTP button hidden initially
document.getElementById("resend-btn").style.display = "none";

// OTP validation and form submission
document.getElementById("otp-form").addEventListener("submit", function(event) {
    event.preventDefault();  // Prevent the default form submission
    console.log("verify button clicked");
    alert("verify button clicked")
    console.log("type of route =",type);

    let Url = (type === 'signup') ? '/verify-otp' : '/verificationForUserAndEmail';
    let otp = document.getElementById("otp-input").value;
    console.log(Url);
    if (otp === "") {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'OTP field cannot be empty!',
        });
    } else {
        // Simulating AJAX for OTP verification
        $.ajax({
            url: Url,  // This should match your backend API endpoint
            type: 'POST',
            data: { otp: otp },
            success: function(response) {
                if (response.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'OTP Verified!',
                        text: 'Your email has been verified successfully.',
                        showConfirmButton:false,
                        timer:1500

                    }).then(() => {
                        window.location.href = response.redirectUrl;  // Proceed to submit the form
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: response.message,
                        text: response.description,
                    });
                }
            },
            error: function() {
                Swal.fire({
                    icon: 'error',
                    title: 'Server Error',
                    text: 'Something went wrong. Please try again later.',
                });
            }
        });
    }
});

// Resend OTP functionality
document.getElementById("resend-btn").addEventListener("click", function() {
    let resendUrl = (type === 'signup') ? '/resend-otp' : '/resent-verificationForUserAndEmail';
    $.ajax({
        url: resendUrl,
        type: 'POST',
        success: function(response) {
            if(response.success){
                Swal.fire({
                    icon: 'success',
                    title: 'OTP Resent!',
                    text: 'A new OTP has been sent to your email.',
                });
            }else{
                Swal.fire({
                    icon: 'error',
                    title: response.title,
                    text: response.message,
                });
            }
            

            

            // Reset countdown
            countdown = 90;
            countdownInterval = setInterval(() => {
                document.getElementById("countdown").innerText = "You can resend OTP in " + countdown + " seconds";
                countdown--;
                if (countdown < 0) {
                    clearInterval(countdownInterval);
                    document.getElementById("countdown").innerText = "";
                    document.getElementById("resend-btn").style.display = "block";
                }
            }, 1000);

            document.getElementById("resend-btn").style.display = "none";
        },
        error: function() {
            Swal.fire({
                icon: 'error',
                title: 'Server Error',
                text: 'Failed to resend OTP. Please try again later.',
            });
        }
    });
});
