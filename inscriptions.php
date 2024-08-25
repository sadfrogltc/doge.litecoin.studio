<?php 

?>
<button class="collapsible">Inscriptions</button>
        <div class="gallery-container">
            <h1>Coming Soon</h1>
        </div>
        <script>
        document.addEventListener("DOMContentLoaded", function() {
            var coll = document.querySelector(".collapsible");
            var content = document.querySelector(".gallery-container");

            coll.addEventListener("click", function() {
                this.classList.toggle("active");
                if (content.style.display === "block") {
                    content.style.display = "none";
                    coll.textContent = "Inscriptions";
                } else {
                    content.style.display = "block";
                    coll.textContent = "Hide Inscriptions";
                }
            });

            // Initially collapse the gallery container
            content.style.display = "none";
        });
    </script>