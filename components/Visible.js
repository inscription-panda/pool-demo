function Visible({ visible = true, children }) {
  if (!visible) {
    return null
  }
  return children
}

export default Visible
