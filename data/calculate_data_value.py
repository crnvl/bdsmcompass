CENTER_POINT = (634, 329)

FACTOR = 0.01
X_PIXEL = 153 # 153 pixel = .01 value on x axis
Y_PIXEL = 30.6 # 30.6 pixel = .01 value on y axis

def main():
    while True:
        x = int(input("Please input a x coordinate: "))
        y = int(input("Please input a y coordinate: "))

        (cx, cy) = CENTER_POINT

        x = (x - cx) / X_PIXEL * FACTOR
        y = (y - cy) / Y_PIXEL * FACTOR * -1
        print(f"X: {x}, Y: {y}");



        print("------------------------")

if __name__ == '__main__':
    main()
