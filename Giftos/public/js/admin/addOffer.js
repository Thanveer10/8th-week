function toggleOfferFields() {
    
    const offerType = document.getElementById('offerType').value;
    const productFields = document.getElementById('productOfferFields');
    const categoryFields = document.getElementById('categoryOfferFields');
    const discountType = document.getElementById('discountTypeDiv');
    
    // Hide all offer-specific fields initially
    productFields.style.display = 'none';
    categoryFields.style.display = 'none';
    discountType.style.display = 'block';
    // Show specific fields based on offer type selection
    if (offerType === 'Product') {
        productFields.style.display = 'block';
    } else if (offerType === 'Category') {
        categoryFields.style.display = 'block';
    }else if (offerType === 'Referral') {
        discountType.style.display = 'none';
        
    }
}

document.getElementById('submitOfferBtn').addEventListener('click', function (event) {
    event.preventDefault();

    // Clear previous errors
    document.querySelectorAll('.invalid-feedback').forEach(el => el.style.display = 'none');
    let isValid = true;

    // Offer Type Validation
    const offerType = document.getElementById('offerType');
    if (!offerType.value) {
        offerType.nextElementSibling.textContent = 'Please select a valid offer type.';
        offerType.nextElementSibling.style.display = 'block';
        isValid = false;
    }
    const discountType = document.getElementById('discountType');
   if(offerType.value === "Referral"){
    
    discountType.value = 'amount'
   }
   if(offerType.value ==='Product'){
   const selectedProuct= document.getElementById('productSelect')
    if (!selectedProuct.value) {
        selectedProuct.nextElementSibling.textContent = 'Please select a Product.';
        selectedProuct.nextElementSibling.style.display = 'block';
        isValid = false;
    }
   }else if(offerType.value ==="Category"){
    const selectedCatogery= document.getElementById('categorySelect')
    if (!selectedCatogery.value) {
        selectedCatogery.nextElementSibling.textContent = 'Please select a Category.';
        selectedCatogery.nextElementSibling.style.display = 'block';
        isValid = false;
    }
   }

    // Offer Title Validation
    const offerTitle = document.getElementById('offerTitle');
    if (!offerTitle.value.trim()) {
        offerTitle.nextElementSibling.textContent = 'Please provide a valid offer title.';
        offerTitle.nextElementSibling.style.display = 'block';
        isValid = false;
    }

    
    if (!discountType.value) {
        discountType.nextElementSibling.textContent = 'Please select a discount type.';
        discountType.nextElementSibling.style.display = 'block';
        isValid = false;
    }

    // Discount Value Validation
    const discountValue = document.getElementById('discountValue');
    if (!discountValue.value || isNaN(discountValue.value) || discountValue.value <= 0) {
        discountValue.nextElementSibling.textContent = 'Please enter a valid discount value.';
        discountValue.nextElementSibling.style.display = 'block';
        isValid = false;
    }
    const pageTitle = document.getElementById('offerPageTittle').innerText;
   
    // If all fields are valid, send data via AJAX
    if (isValid) {
        const formData = new FormData(document.getElementById('addOfferForm'));
        for (const [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
          }
       if(pageTitle ==="Add New Offer"){
        console.log('reached add new offer fetch')
          fetch('/admin/addOffer', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = '/admin/offers';
            } else {
                alert(data.message);
            }
        })
        .catch(err => alert('An error occurred: ' + err.message));
    }else if(pageTitle ==="Edit Offer"){
        const offerId= document.getElementById("offerId").value;
        console.log('offer id: ' + offerId);
        console.log('reached update offer fetch')
        fetch(`/admin/updateOffer?offerId=${offerId}`, {
            method: 'POST',
            body: formData
        })
       .then(response => response.json())
       .then(data => {
        if (data.success) {
            window.location.href = '/admin/offers';
        } else {
            alert(data.message);
        }
    })
    .catch(err => alert('An error occurred: ' + err.message));
    }
    }
});