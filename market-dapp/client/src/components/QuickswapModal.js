import * as React from 'react';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import "../css/modal.css";

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600,
    bgcolor: '#000',
    border: '2px solid #000',
    color: 'white',
    minHeight: '300',
    boxShadow: 24
  };

const iframe = `<iframe
  src="https://quickswap.exchange/#/swap?currency0=ETH&currency1=0x49B1bE61A8Ca3f9A9F178d6550e41E00D9162159&swapIndex=0"
  height="660px"
  width="100%"
  style="
      border: 0;
      margin: 0 auto;
      display: block;
      border-radius: 10px;
      max-width: 600px;
      min-width: 300px;
  "
  />`;

class QuickswapModal extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            open: props.open,
            onClose: props.onClose
        }
  }

  handleOpen = async () => {
    this.setState({open: true});
  }
  handleClose = async () => {
    this.setState({open: false});
    this.state.onClose();
  }

  render() {
    if(this.state.open || this.props.open) {
        return (
            <div>
              <Modal
                open={this.state.open}
                onClose={this.handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
              >
                <div className="main-container">
                    <Box className="simple-modal" sx={style}>
                        <Typography id="modal-modal-title" className="simple-modal-title" variant="h6" component="h2">
                            Quickswap
                        </Typography>
                        <div dangerouslySetInnerHTML={{__html: iframe}}></div>
                    </Box>
                </div>
              </Modal>
            </div>
          );
    }
    
  }
  
}

export default QuickswapModal;