import React, { Component } from 'react';
import { Button, Card, ListGroup } from 'react-bootstrap';
import "../css/mainpage.css";

const listStyle = {
    overflowY: "scroll",
    border: '1px solid red',
    width: '500px',
    float: 'left',
    height: '500px',
    position: 'relative'
}


class MainPage extends Component {

    constructor(props) {
        super(props);

        this.state = {
            drizzle: props.drizzle,
            drizzleState: props.drizzleState,
            listCars: [],
            listSkins: [],
        }

    }

    componentDidMount = async () => {
        const contract = await this.state.drizzle.contracts.IPFSInbox
        const response_cars = await contract.methods.getCars().call();
        const response_skins = await contract.methods.getSkins().call();
        this.setState({ listCars: response_cars, listSkins: response_skins });
    }

    getLists = async (event) => {
        event.preventDefault();
        for (const [index, value] of this.state.listCars.entries()) {
            let ipfsHash = this.state.listCars[index].ipfsHash
            let carBrand = this.state.listCars[index].carBrand
            let track = this.state.listCars[index].track
            let simulator = this.state.listCars[index].simulator
            let season = this.state.listCars[index].season
            let price = this.state.listCars[index].price

            console.log(value)
        }
    }


    render() {

        const cars = [];
        const skins = [];

        if (!this.state.listCars.isEmpty || !this.state.listSkins.isEmpty) {

            for (const [index, value] of this.state.listCars.entries()) {
                let ipfsHash = value.ipfsHash
                let carBrand = value.carBrand
                let track = value.track
                let simulator = value.simulator
                let season = value.season
                let price = value.price
                cars.push(
                    <ListGroup.Item key={index}>
                        <Card style={{ width: '18rem' }} key={index}>
                            <Card.Body>
                                <Card.Title>{carBrand}</Card.Title>
                                <Card.Text>
                                    <div><b>IPFS hash:</b> {ipfsHash}</div>
                                    <div><b>Track:</b> {track}</div>
                                    <div><b>Simulator:</b> {simulator}</div>
                                    <div><b>Season:</b> {season}</div>
                                    <div><b>Price:</b> {price}</div>
                                </Card.Text>
                                {/*  <Button variant="primary">Go somewhere</Button> */}
                            </Card.Body>
                        </Card>
                    </ListGroup.Item>
                )
            }

            for (const [index, value] of this.state.listSkins.entries()) {
                let ipfsHash = value.ipfsHash
                let carBrand = value.carBrand
                let simulator = value.simulator
                let price = value.price
                skins.push(
                    <ListGroup.Item key={index}>
                        <Card className="card">
                            <Card.Body>
                                <Card.Title>{carBrand}</Card.Title>
                                <Card.Text>
                                    <div><b>IPFS hash:</b> {ipfsHash}</div>
                                    <div><b>Simulator:</b> {simulator}</div>
                                    <div><b>Price:</b> {price}</div>
                                </Card.Text>
                                {/*  <Button variant="primary">Go somewhere</Button> */}
                            </Card.Body>
                        </Card>
                    </ListGroup.Item>
                )
            }
        }
        return (
            <div>
                <div className="center-text">
                    <h1 >Items</h1>
                </div>
                <div>Available Cars</div>
                <div style={{ listStyle }}>
                    <ListGroup>
                        {cars}
                    </ListGroup>

                </div>
                <div>Available Skins</div>
                <div>
                    <ListGroup bsStyle="default" className="list-group list-group-horizontal nopadding">
                        {skins}
                    </ListGroup>
                </div>
                <br>
                </br>
                {/* <Button onClick={this.getLists}>Get list</Button> */}
            </div>
        );
    }
}

export default MainPage;