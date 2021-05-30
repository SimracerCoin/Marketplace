
export default class UIHelper {
  static transactionOnSent = function () {
    var elem1 = document.createElement('div');
    elem1.className = 'spinner-outer';
    elem1.id = 'wait-div';
    var elem2 = document.createElement('div');
    elem2.className = 'spinner';
    elem1.appendChild(elem2);
    document.body.appendChild(elem1);
  }

  static transactionOnConfirmation = function (message, redirect = true) {
    document.body.removeChild(document.getElementById('wait-div'));
    alert(message);

    if(redirect)
      window.location.href = "/";
  }

  static transactionOnError = function (error) {
    document.body.removeChild(document.getElementById('wait-div'));
    alert("Something wrong. Please try again.");
    console.log(error);
  }
}