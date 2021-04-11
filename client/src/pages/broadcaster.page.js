import React from "react";
import io from 'socket.io-client'
import './styles/home.style.css'
import configs from '../config'

class BroadCaster extends React.Component {
    constructor() {
        super()
        this.state = {
            // client list
            peerConnections: {},
            // socket connection
            socket: io(`${configs.API_URL}`)
        }
    }

    componentDidMount() {

        // Use camera
        const videoCamera = document.getElementById("camera");
        navigator.mediaDevices
            .getUserMedia(configs.VIDEO_CONSTRAINS)
            .then(stream => {
                videoCamera.srcObject = stream;
                this.state.socket.emit("broadcaster");
            })
            .catch(error => console.error(error));

        // Use screen
        // const videoScreen = document.getElementById("screen");
        // navigator.mediaDevices.getDisplayMedia(config.VIDEO_CONSTRAINS)
        //     .then(function (mediaStream) {
        //         videoScreen.srcObject = mediaStream;
        //     })
        //     .catch(function (err) { console.log(err.name + ": " + err.message); });

        // Socket handler
        this.state.socket.on("start-watching", clientId => {
            const peerConnection = new RTCPeerConnection(configs.STUN_CONFIG);

            // update state
            this.setState(prevState => {
                let newPeerConnections = prevState.peerConnections
                newPeerConnections[clientId] = peerConnection
                return {
                    socket: this.state.socket,
                    peerConnections: newPeerConnections
                }
            })

            let streamCamera = videoCamera.srcObject;
            streamCamera.getTracks().forEach(track => {
                peerConnection.addTrack(track, streamCamera)
            });

            peerConnection.onicecandidate = event => {
                if (event.candidate) {
                    this.state.socket.emit("candidate", clientId, event.candidate);
                }
            };

            peerConnection
                .createOffer()
                .then(sdp => peerConnection.setLocalDescription(sdp))
                .then(() => {
                    this.state.socket.emit("offer", clientId, peerConnection.localDescription);
                });
        });

        this.state.socket.on("answer", (id, description) => {
            this.state.peerConnections[id].setRemoteDescription(description);
        });

        this.state.socket.on("candidate", (id, candidate) => {
            this.state.peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
        });

        this.state.socket.on("disconnectPeer", id => {
            this.state.peerConnections[id].close();
            delete this.state.peerConnections[id];
            console.log(this.state.peerConnections)
        });

        window.onunload = window.onbeforeunload = () => {
            this.state.socket.close();
        };
    }

    // Stop streamming
    StopStreaming = () => {

    }

    // Start streaming
    SwitchShare = () => {
        
    }

    render() {
        return (
            <div>
                User: hoangnd&nbsp;
                <button id='control-btn' onClick={this.ShareScreen}>Share screen</button>
                <div id='stream-screen' style={{ margin: '20px' }}>
                    <video id='camera' playsInline autoPlay muted></video>
                    &nbsp;
                    &nbsp;
                    &nbsp;
                    <video id='screen' playsInline autoPlay muted></video>
                </div>
            </div>
        )
    }
}

export default BroadCaster;