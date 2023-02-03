import * as React from 'react';
import Box from '@mui/material/Box';
import { Form, Button } from 'react-bootstrap';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import "../css/simplemodal.css";

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 500,
    bgcolor: '#000',
    border: '2px solid #000',
    color: 'white',
    minHeight: '300',
    boxShadow: 24
  };

class SimpleModal extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            open: props.open,
            onApproval: props.onApproval,
            price: '',
            quantity: 1
        }

        this.handlePriceChange = this.handlePriceChange.bind(this);
        this.handleQuantityChange = this.handleQuantityChange.bind(this);
  }

  handleOpen = async () => {
    this.setState({open: true});
  }
  handleClose = async () => {
    this.setState({open: false});
  }

  approveNFT = async(event) => {
    event.preventDefault();
    this.setState({open: false});
    if(this.state.price > 0 && this.state.quantity === 1)
    if(this.state.onApproval && typeof this.state.onApproval == 'function') {
        this.state.onApproval(this.state.price); 
    }
  }

  handlePriceChange = (e) => {
    console.log(e.target.value);
    if(!isNaN(e.target.value)) {
      e.target.value = Number(e.target.value).toString();
      this.setState({price: e.target.value});
    }
  }

  handleQuantityChange = (e) => {
    if(!isNaN(e.target.value)) {
      e.target.value = Number(e.target.value).toString();
      this.setState({quantity: e.target.value});
    }
  }

  render() {
    if(this.state.open || this.props.open) {
        return (
            <div>
              {/*<Button onClick={this.handleOpen}>Open modal</Button>*/}
              <Modal
                open={this.state.open}
                onClose={this.handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
              >
                <div className="main-container">
                    <Box className="simple-modal" sx={style}>
                    <Form>   
                    <Typography id="modal-modal-title" className="simple-modal-title" variant="h6" component="h2">
                        List your NFT
                    </Typography>
                    <div className='div-modal-column'>
                    <label>Quantity:</label>
                    <Form.Control size="20" min="1" step="1" max="1" type="number" value={this.state.quantity} readOnly="true" onChange={this.handleQuantityChange} />
                        {/*<!--<input type="number" size="20" onChange={this.handleQuantityChange}>{this.state.quantity}</input>-->*/}
                    </div>
                    <br/>
                    <label>Price per unit:</label>
                    <br/>
                    <div className='div-modal-row'>
                        <select>
                            <option className='src-coin'>SRC</option>
                        </select>
                        <Form.Control size="20" min="0" step="0.01" pattern="([0-9]*[.])?[0-9]+" type="number" placeholder="0.01" value={this.state.price} onChange={this.handlePriceChange} />
                        {/*>!<--<input type="number" size="20" onChange={this.handlePriceChange}>{this.state.price}</input>-->*/}
                    </div>
                    {false &&
                    <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                        Advanced options
                    </Typography>}
                    <br />
                    <div className="approve-container">
                        <Button variant="warning" onClick={this.approveNFT}>Approve NFT</Button>
                    </div>
                    <br />
                    {false && <div className="service-fees">(i) Service fee<span className="fees-percentage">5%</span></div>}
                    </Form>
                    </Box>
                </div>
              </Modal>
            </div>
          );
    }
    
  }
  
}

export default SimpleModal;