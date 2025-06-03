import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyFlagsComponent } from './my-flags.component';

describe('MyFlagsComponent', () => {
  let component: MyFlagsComponent;
  let fixture: ComponentFixture<MyFlagsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyFlagsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyFlagsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
