import { Box } from "@mui/material"
import Slider from "react-slick"
import "slick-carousel/slick/slick.css"
import "slick-carousel/slick/slick-theme.css"
interface Props {
    images: string[]
}

export default function Carousel({ images }: Props) {
    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
    }

    return (
        <Box sx={{ "& .slick-dots li button:before": { color: "primary.main" } }}>
            <Slider {...settings}>
                {images.map((src, i) => (
                    <Box key={i} sx={{ px: 1 }}>
                        <Box
                            component="img"
                            src={src}
                            alt="Product visual"
                            sx={{
                                width: "100%",
                                height: 240,
                                objectFit: "cover",
                                borderRadius: 2,
                            }}
                        />
                    </Box>
                ))}
            </Slider>
        </Box>
    )
}