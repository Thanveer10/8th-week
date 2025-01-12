// public/js/adminJs/products.js

try {
    document.getElementById('searchOrder').addEventListener('input', function() {
        const orderTerm = this.value.trim();
        const url = new URL(window.location.href);
        if (orderTerm) {
            url.searchParams.set('search', orderTerm);
        } else {
            url.searchParams.delete('search');
        }
        url.searchParams.set('page', 1); // Reset to first page on new search
        window.location.href = url.toString();
    }); 
} catch (error) {
    console.log('erorr in search order order.js ===', error.message);
    
}






// orders.js
try {
    document.querySelectorAll('.order-status').forEach((element) => {
        console.log('reached to oreder.js')
        element.addEventListener('change', function() {
            const orderId = this.getAttribute('data-order-id');
            
            const newStatus = this.value;
    
            fetch(`/admin/orders/update-status/${orderId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Swal.fire(
                        'Order status updated successfully',
                        data.message,
                        'success'
                     ).then(() => {
                        // Reload the page to reflect the updated cart
                        location.reload();
                    });
                 } else {
                    Swal.fire('Error', data.message  || 'Failed to update order status.', 'error');
                }
            })
            .catch(error => {
                Swal.fire('Error', 'There was a problem connecting to the server.', 'error');
            });
        });
    });
} catch (error) {
    console.log('error in order status update in order.js===', error.message || 'Error')
}








function cancelOrder(orderId, itemOrderId) {
    try {
        if (confirm('Are you sure you want to cancel this order?')) {
            $.ajax({
                url: `/admin/order/cancel/${orderId}/${itemOrderId}`,
                type: 'POST',
                success: function(response) {
                    if (response.success) {
                        alert(response.message);
                        location.reload(); // Refresh the page to reflect changes
                    } else {
                        alert('Failed to cancel the order.');
                    }
                },
                error: function() {
                    alert('An error occurred while canceling the order.');
                }
            });
        }
    } catch (error) {
        console.log('error in cancel order in orders.js  ==' ,error)
    }
   
}
