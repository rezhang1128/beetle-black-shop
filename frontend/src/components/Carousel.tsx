import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'


interface Props { images: string[] }


export default function Carousel({ images }: Props) {
    const settings = { dots: true, infinite: true, speed: 500, slidesToShow: 1, slidesToScroll: 1 }
    return (
        <Slider {...settings}>
            {images.map((src, i) => (
                <div key={i}>
                    <img src={src} style={{ width: '100%', height: 240, objectFit: 'cover' }} />
                </div>
            ))}
        </Slider>
    )
}