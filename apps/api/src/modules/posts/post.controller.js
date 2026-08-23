export const handleGetAllPost = (req, res, next) => {
    try {
        return res.json({ msg: 'Is running' })
    } catch (err) {
        next(err)
    }
}