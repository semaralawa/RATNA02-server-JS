import websocket
import ssl
import json
import serial

# serialPort = serial.Serial(port="/COM4", baudrate=115200)
# serialPort.flushInput()

IndividualMotor = [0, 0, 0, 0]
SendSlaveMotor = ""
SpeedMotor = 50


def open_func(ws):
    print("Server connected")


def close_func(ws, close_status_code, close_msg):
    print("server disconnected, stopping robot.....")
    SendSlaveMotor = f"*{2}#"  # noqa:E501
    # serialPort.write(SendSlaveMotor)


def message_func(ws, message):
    data = json.loads(message)
    if data['movement'] == 'upleft':
        move_index = 3
    elif data['movement'] == "up":
        move_index = 5
    elif data['movement'] == "upright":
        move_index = 0
    elif data['movement'] == "turnleft":
        move_index = 9
    elif data['movement'] == "left":
        move_index = 4
    elif data['movement'] == "right":
        move_index = 3
    elif data['movement'] == "turnrigt":
        move_index = 9

    elif data['movement'] == "downleft":
        move_index = 9
    elif data['movement'] == "down":
        move_index = 9
    elif data['movement'] == "downright":
        move_index = 9
    else:
        move_index = 2

    SendSlaveMotor = f"*{move_index}#"
    # serialPort.write(SendSlaveMotor)


def error_func(ws, error):
    print(error)


websocket.enableTrace(True)
ws = websocket.WebSocketApp("wss://34.101.141.49",
                            on_message=message_func,
                            on_error=error_func,
                            on_close=close_func)
ws.on_open = open_func

ws.run_forever(sslopt={"cert_reqs": ssl.CERT_NONE})
