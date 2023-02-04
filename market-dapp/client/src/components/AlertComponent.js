import '../css/App.css';
import '../css/components.css';
import React from 'react';
import { Alert } from 'react-bootstrap'; // Check out drizzle's react components at @drizzle/react-components


class AlertComponent extends React.Component{

  hamburgerOpen = false;

  constructor(props) {
        super(props);

        this.state = {
            cssClasses: props.cssClasses,
            variant: props.variant,
            message: props.message,
            title: props.title,
            show: props.show,
            closeHandler: props.closeHandler
        }
  }

  printExtraInfo = () => {
    if(this.props.variant === 'success') {
      return (
          <p>(Please note that the page might take a few seconds to reflect the changes)</p>
        )
    }return null;
  }
 
  render() {

    if (this.state.show || this.props.show) {
        return (
            <Alert className={`${this.props.cssClasses}`} variant={this.props.variant} onClose={() => this.close()} dismissible>
              <Alert.Heading>{this.props.title}</Alert.Heading>
              <div className='alert_body'>
                <p>
                {this.props.message}
                </p>
                {this.printExtraInfo()}
              </div>
            </Alert>
          );
    }
    return null;

  }

  close = () => {
    this.setState({show: false});
    if(this.state.closeHandler) {
      this.state.closeHandler();
    }
  }

 
}

export default AlertComponent;
