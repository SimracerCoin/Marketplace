import React, { Component } from 'react';
import {
    BrowserRouter,
    Switch,
    Route
} from "react-router-dom";
import MainPage from "./MainPage";
import UploadCar from "./UploadCar";
import UploadSkin from "./UploadSkin";
import SellOwnership from "./SellOwnership";
import UploadSimracerMoment from "./UploadSimracerMoment";
import NavbarPage from "./NavbarPage";
import RegisterVendor from "./RegisterVendor";
import ItemPage from "./ItemPage";
import NotificationsPage from "./NotificationsPage";
import SellerPage from "./SellerPage";
import AboutPage from "./AboutPage";
import FaqsPage from "./FaqsPage";
import StorePage from "./StorePage";
import AuctionPage from "./AuctionPage";
import NFTInventoryPage from "./NFTInventoryPage";

class RouterPage extends Component {

    render() {
        const { drizzle, drizzleState } = this.props;
        
        return (
            <BrowserRouter>
                <NavbarPage drizzle={drizzle} drizzleState={drizzleState} />
                <Switch>
                    <Route exact path="/uploadcar">
                        <UploadCar drizzle={drizzle} drizzleState={drizzleState} />
                    </Route>
                    <Route exact path="/uploadskin">
                        <UploadSkin drizzle={drizzle} drizzleState={drizzleState} />
                    </Route>
                    <Route exact path="/sellownership">
                        <SellOwnership drizzle={drizzle} drizzleState={drizzleState} />
                    </Route>
                    <Route exact path="/sellmomentnft">
                        <UploadSimracerMoment drizzle={drizzle} drizzleState={drizzleState} />
                    </Route>
                    <Route exact path="/registorvendor">
                        <RegisterVendor drizzle={drizzle} drizzleState={drizzleState} />
                    </Route>
                    <Route path="/item/:category/:id">
                        <ItemPage drizzle={drizzle} drizzleState={drizzleState} />
                    </Route>
                    <Route exact path="/notifications">
                        <NotificationsPage drizzle={drizzle} drizzleState={drizzleState} />
                    </Route>
                    <Route path="/seller">
                        <SellerPage drizzle={drizzle} drizzleState={drizzleState} />
                    </Route>
                    <Route exact path="/about">
                        <AboutPage />
                    </Route>
                    <Route exact path="/faqs">
                        <FaqsPage />
                    </Route>
                    <Route path="/store">
                        <StorePage drizzle={drizzle} drizzleState={drizzleState}/>
                    </Route>
                    <Route path="/inventory">
                        <NFTInventoryPage drizzle={drizzle} drizzleState={drizzleState}/>
                    </Route>
                    <Route path="/auction">
                        <AuctionPage drizzle={drizzle} drizzleState={drizzleState}/>
                    </Route>
                    <Route exact path="/">
                        <MainPage drizzle={drizzle} drizzleState={drizzleState}/>
                    </Route>
                </Switch>
            </BrowserRouter>
        );
    }
}

export default RouterPage;