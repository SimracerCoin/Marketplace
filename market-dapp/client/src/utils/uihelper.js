
export default class UIHelper {
  static showSpinning = function (textToDisplay) {
    var elem1 = document.createElement('div');
    elem1.style.top = window.scrollY + 'px';
    elem1.className = 'spinner-outer';
    elem1.id = 'wait-div';
    
    var elem2 = document.createElement('div');
    elem2.className = 'spinner';
    elem1.appendChild(elem2);

    var elem3 = document.createElement('div');
    elem3.className = 'h-100 d-flex justify-content-center align-items-center spinner-msg';

    var text = document.createTextNode(textToDisplay ? textToDisplay : "Wait for the transaction to be confirmed...");

    elem3.appendChild(text);
    elem1.appendChild(elem3);
    document.body.appendChild(elem1);

    if (!document.onscroll)
      document.addEventListener('scroll', function (e) {
        let elem = document.getElementById('wait-div');
        if(elem)
          elem.style.top = window.scrollY + 'px';

        document.onscroll = true;
      });
  }

  static hiddeSpinning = function() {
    var elem = document.getElementById("wait-div");
    if(elem) {
      elem.parentNode.removeChild(elem);
    }
  }

  static transactionOnConfirmation = function (message, redirect = true) {
    document.body.removeChild(document.getElementById('wait-div'));
    alert(message);

    if (redirect)
      window.location.href = redirect;
  }

  static transactionOnError = function (error) {
    document.body.removeChild(document.getElementById('wait-div'));
    alert("Something wrong. Please try again.");
    console.log(error);
  }
  
}