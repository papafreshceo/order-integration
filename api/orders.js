module.exports = async (req, res) => {
  res.status(200).json({ 
    message: "주문 API 준비 중",
    method: req.method,
    time: new Date().toISOString()
  });
};
