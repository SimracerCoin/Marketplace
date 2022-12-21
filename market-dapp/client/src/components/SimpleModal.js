import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
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
            onApproval: props.onApproval
        }
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
    if(this.state.onApproval && typeof this.state.onApproval == 'function') {
        this.state.onApproval(); 
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
                    <Typography id="modal-modal-title" className="simple-modal-title" variant="h6" component="h2">
                        List your NFT
                    </Typography>
                    <div className='div-modal-column'>
                    <label>Quantity:</label>
                        <input type="text" size="20"></input>
                    </div>
                    <br/>
                    <label>Price per unit:</label>
                    <br/>
                    <div className='div-modal-row'>
                        <select>
                            <option className='src-coin'>SRC</option>
                        </select>
                        <input type="text" size="20"></input>
                    </div>
                    <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                        Advanced options
                    </Typography>
                    <div className="approve-container">
                        <Button class="approve-nft" onClick={this.approveNFT}>Approve NFT</Button>
                    </div>
                    <br/>
                    <div className="service-fees">(i) Service fee<span className="fees-percentage">5%</span></div>
                    </Box>
                </div>
              </Modal>
            </div>
          );
    }
    
  }
  
}

export default SimpleModal;