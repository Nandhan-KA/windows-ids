import socket
import time
def test_port(host, port, timeout=2):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    result = sock.connect_ex((host, port))
    sock.close()
    return result == 0
print("Testing connection to the server...")
for i in range(30):
    if test_port('localhost', 5000):
        print(f"✅ Success! Port 5000 is open - server is running")
        break
    else:
        print(f"Waiting for server to start... ({i+1}/30)")
        time.sleep(1)
else:
    print("❌ Failed to connect to the server after 30 seconds") 