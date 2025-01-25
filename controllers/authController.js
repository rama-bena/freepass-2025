class AuthController {
    register(req, res) {
        console.log(req.url);
        res.send("get from " + req.url);
    }

}

const authController = new AuthController();
export default authController;
